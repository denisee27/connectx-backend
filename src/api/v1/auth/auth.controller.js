// Helper to parse refresh token expiry to milliseconds
import { parseExpiryToMs } from "../../../utils/index.js";

export default {
  async login(req, res, next) {
    try {
      const authService = req.scope.resolve("authService");
      const env = req.scope.resolve("env");

      const result = await authService.login(req.body);

      //TODO : We can put this into utility and inject it if you have multiple refreshToken use case
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production" || env.COOKIE_SECURE,
        sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: parseExpiryToMs(env.JWT_REFRESH_EXPIRES_IN),
        path: "/api/v1/auth",
        domain: env.COOKIE_DOMAIN,
      });

      // Return only access token and user info (no refresh token in response)
      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req, res, next) {
    try {
      const authService = req.scope.resolve("authService");

      // Get refresh token from cookie instead of body
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: "Refresh token not found",
        });
      }

      const result = await authService.refreshToken({ refreshToken });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      const authService = req.scope.resolve("authService");
      await authService.logout({ userId: req.user.userId });

      // Clear the refresh token cookie
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: req.scope.resolve("env").NODE_ENV === "production",
        sameSite: req.scope.resolve("env").NODE_ENV === "production" ? "strict" : "lax",
        path: "/api/v1/auth",
      });

      res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  },

  async me(req, res, next) {
    try {
      const authService = req.scope.resolve("authService");
      const user = await authService.getCurrentUser({ userId: req.user.userId });

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async createUser(req, res, next) {
    try {
      const authService = req.scope.resolve("authService");
      const clientContext = req.clientContext;

      await authService.createUser(clientContext, req.body);
      res.status(201).json({
        success: true,
        data: {
          message: "Successfully created, please validate your email",
        },
      });
    } catch (exception) {
      next(exception);
    }
  },
  async verifyEmail(req, res, next) {
    try {
      const authService = req.scope.resolve("authService");
      const clientContext = req.clientContext;
      const token = req.body;

      await authService.verifyEmail(token, clientContext);

      res.status(200).json({
        success: true,
        data: {
          message: "Email verified successfully",
        },
      });
    } catch (exception) {
      next(exception);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      const authService = req.scope.resolve("authService");
      const clientContext = req.clientContext;

      await authService.forgotPassword(req.body, clientContext);

      res.status(200).json({
        success: true,
        data: {
          message: "Password reset email sent",
        },
      });
    } catch (exception) {
      next(exception);
    }
  },

  async requestEmail(req, res, next) {
    try {
      const authService = req.scope.resolve("authService");
      const clientContext = req.clientContext;
      const email = req.body;

      await authService.requestEmail(email, clientContext);

      res.status(200).json({
        success: true,
        data: {
          message: "Email sent successfully",
        },
      });
    } catch (exception) {
      next(exception);
    }
  },


  async resetPassword(req, res, next) {
    try {
      const authService = req.scope.resolve("authService");
      const clientContext = req.clientContext;

      // req.body already cleaned
      await authService.resetPassword(req.body, clientContext);

      res.status(200).json({
        success: true,
        data: {
          message: "Password reset successfully, please login again",
        },
      });
    } catch (exception) {
      next(exception);
    }
  },

};


