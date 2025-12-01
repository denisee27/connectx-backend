import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UnauthorizedError, NotFoundError, ValidationError } from "../errors/httpErrors.js";
import { buildSendVerificationEmail } from "../../infra/mailer/templates/sendVerification/sendVerification.js";

import pkg from "@prisma/client";
import { addTime } from "../../utils/time.utils.js";
const { Status, AuthenticationEvent } = pkg;
import { buildSendForgotPasswordEmail } from "../../infra/mailer/templates/sendForgotPassword/sendForgotPassword.js";


const safeMetadata = ({ platform, location, extra }) => {
  const meta = {
    ...(platform ? { platform } : {}),
    ...(location ? { location } : {}),
    ...(extra && Object.keys(extra).length ? { extra } : {}),
  };
  return Object.keys(meta).length ? meta : undefined;
};
export function makeAuthService({
  userRepository,
  authRepository,
  mailerService,
  rbacRepository,
  authenticationLogRepository,
  roomRepository,
  env,
  logger,
  prisma
}) {
  return {
    async login({ email, password }) {
      const user = await userRepository.findByEmailForAuth(email);

      if (!user || user.status === Status.DELETED) {
        throw new UnauthorizedError("Invalid credentials");
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedError("Invalid credentials");
      }

      if (user.status !== "ACTIVE") {
        throw new UnauthorizedError("Account is not active");
      }

      if (!user.emailVerifiedAt) {
        throw new UnauthorizedError("Email not verified");
      }

      const accessToken = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          userVersion: user.userVersion,
        },
        env.JWT_SECRET,
        {
          expiresIn: env.JWT_EXPIRES_IN,
        }
      );

      const refreshToken = jwt.sign(
        {
          userId: user.id,
          refreshTokenVersion: user.refreshTokenVersion,
        },
        env.JWT_REFRESH_SECRET,
        {
          expiresIn: env.JWT_REFRESH_EXPIRES_IN,
        }
      );

      const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

      await userRepository.update(user.id, {
        refreshTokenHash,
        lastLoginAt: new Date(),
      });

      const permissions = await rbacRepository.getUserPermissions(user.id);
      const paymentData = await roomRepository.isPayment(user.id);

      logger.info({ userId: user.id }, "User logged in");

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          city: user.city,
          profilePictureUrl: user.profilePictureUrl,
          isPayment: !!paymentData,
          phoneNumber: user.phoneNumber,
          permissions: permissions.map((p) => p.code),
        },
      };
    },

    /**
     * Get current user details with fresh permissions
     */
    async getCurrentUser({ userId }) {
      const user = await authRepository.findById(userId);
      if (!user || user.status !== "ACTIVE") {
        throw new UnauthorizedError("User not found or inactive");
      }

      // Get fresh permissions from database
      const permissions = await rbacRepository.getUserPermissions(userId);
      const paymentData = await roomRepository.isPayment(userId);
      logger.info(
        {
          userId,
          permissionCount: permissions.length,
          permissions: permissions.map((p) => p.code),
        },
        "User permissions fetched"
      );
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        city: user.city,
        profilePictureUrl: user.profilePictureUrl,
        isPayment: !!paymentData,
        phoneNumber: user.phoneNumber,
        emailVerifiedAt: user.emailVerifiedAt,
        profilePictureUrl: user.profilePictureUrl,
        permissions: permissions.map((p) => p.code),
      };
    },

    async refreshToken({ refreshToken }) {
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
      } catch (error) {
        throw new UnauthorizedError("Error at decoding refresh token");
      }

      const user = await authRepository.findById(decoded.userId);
      if (!user || user.status !== "ACTIVE") {
        throw new UnauthorizedError("Invalid refresh token");
      }

      if (decoded.refreshTokenVersion !== user.refreshTokenVersion) {
        logger.warn({ userId: user.id }, "Refresh token version mismatch - possible replay attack");
        throw new UnauthorizedError("Invalid refresh token");
      }

      const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");

      if (user.refreshTokenHash !== hashedToken) {
        throw new UnauthorizedError("Invalid refresh token");
      }

      const newAccessToken = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          userVersion: user.userVersion,
        },
        env.JWT_SECRET,
        {
          expiresIn: env.JWT_EXPIRES_IN,
        }
      );

      return { accessToken: newAccessToken };
    },

    async logout({ userId }) {
      await userRepository.update(userId, {
        refreshTokenHash: null,
      });
      logger.info({ userId }, "User logged out");
    },

    /**
     * Invalidate all user sessions (both access and refresh tokens)
     */
    async invalidateAllSessions({ userId }) {
      const user = await authRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      await userRepository.update(userId, {
        userVersion: user.userVersion + 1, // Invalidate all access tokens
        refreshTokenVersion: user.refreshTokenVersion + 1, // Invalidate all refresh tokens
        refreshTokenHash: null, // Clear stored refresh token
      });

      logger.info({ userId }, "All user sessions invalidated");
    },

    /**
     * Invalidate only access tokens (user needs to refresh to get new role/permissions)
     */
    async invalidateAccessTokens({ userId }) {
      const user = await authRepository.findById(userId);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      await userRepository.update(userId, {
        userVersion: user.userVersion + 1, // Invalidate all access tokens
      });

      logger.info({ userId }, "User access tokens invalidated");
    },

    async createUser(clientContext, data) {
      const { email, name, bornDate, phoneNumber, gender, occupation, countryId, cityId, password } = data;

      const existingUser = await authRepository.findByEmailIsUsing(email);
      if (existingUser) {
        throw new ValidationError("Email is already in use");
      }

      const role = await authRepository.findRoleByName("User"); // TODO: validate this
      if (!role) {
        throw new ValidationError("Default role User not found");
      }
      const hashedPassword = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
      
      const token = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
      const expiresAt = addTime(new Date(), "24h");
      
      const verificationEmail = buildSendVerificationEmail({
        appUrl: env.APP_URL,
        token,
        name: name,
        email: email,
      });

      const alreadyRegistered = await authRepository.findByEmailRegistered(email);
      if (alreadyRegistered) {
        await userRepository.update(alreadyRegistered.id, {
          name,
          bornDate,
          phoneNumber,
          gender,
          occupation,
          countryId,
          cityId,
          passwordHash: hashedPassword,
          roleId: role.id,
          verificationToken: hashedToken,
          verificationExpiresAt: expiresAt,
          emailVerifiedAt: null,
        });
      } else {
        await prisma.$transaction(async (tx) => {
          await tx.user.create({
            data: {
              email,
              name,
              bornDate,
              phoneNumber,
              gender,
              occupation,
              countryId,
              cityId,
              passwordHash: hashedPassword,
              roleId: role.id,
              verificationToken: hashedToken,
              verificationExpiresAt: expiresAt,
            },
          });
        });
      }

      await mailerService.sendEmail({
        to: email,
        ...verificationEmail,
        appUrl: env.APP_URL,
      });
    },

    async requestEmail({ email }, clientContext) {
      const user = await authRepository.findByEmail(email);
      if (!user) {
        return;
      }

      if (user.emailVerifiedAt) {
        throw new ConflictError("Email already verified");
      }

      const token = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
      const expiresAt = addTime(new Date(), "24h");

      const verificationEmail = buildSendVerificationEmail({
        appUrl: env.APP_URL,
        token,
        name: user.name,
        email: user.email,
        username: user.username,
      });

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            verificationToken: hashedToken,
            verificationExpiresAt: expiresAt,
          },
        });
      });

      await mailerService.sendEmail({
        to: user.email,
        ...verificationEmail,
      });
    },

    async verifyEmail({ token }, clientContext) {
      const now = new Date();
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
      const user = await authRepository.findByVerificationToken(hashedToken);

      if (user.emailVerifiedAt) {
        throw new ConflictError("Email already verified");
      }

      if (!user.verificationExpiresAt || user.verificationExpiresAt < now) {
        throw new ValidationError("Verification token has expired");
      }

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            emailVerifiedAt: now,
            verificationToken: null,
            verificationExpiresAt: null,
          },
        });
      });
    },
    async forgotPassword({ email }, clientContext) {
      const user = await authRepository.findByEmail(email);
      if (!user) {
        return;
      }

      const token = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

      await prisma.$transaction(async (tx) => {
        const now = new Date();

        // update user data
        await tx.user.update({
          where: { id: user.id },
          data: {
            passwordResetToken: hashedToken,
            passwordResetExpires: addTime(now, "1h"),
          },
        });
      });

      const forgotPasswordEmail = buildSendForgotPasswordEmail({
        appUrl: env.APP_URL,
        token,
        name: user.name,
        username: user.username,
      });

      await mailerService.sendEmail({
        to: user.email,
        ...forgotPasswordEmail,
        appUrl: env.APP_URL,
      });

      logger.info({ userId: user.id }, "Forgot password email sent");
    },

    async resetPassword({ token, password, confirmPassword }, clientContext) {
      if (password !== confirmPassword) {
        throw new ValidationError("Passwords do not match");
      }

      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
      const user = await authRepository.findByPasswordResetToken(hashedToken);

      if (!user) {
        throw new ValidationError("Token is invalid");
      }

      const now = new Date();
      if (!user.passwordResetExpires || user.passwordResetExpires <= now) {
        throw new ValidationError("Token has expired");
      }

      const hashedPassword = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: {
            passwordHash: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null,
            refreshTokenHash: null,
            refreshTokenVersion: user.refreshTokenVersion + 1,
            userVersion: user.userVersion + 1,
          },
        });
      });

      logger.info({ userId: user.id }, "Password reset");
    },



  };
}
