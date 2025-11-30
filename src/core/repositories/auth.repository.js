/**
 * Creates a authentication repository with methods to interact with the User model in the database.
 * Primarily for authentcation purposes
 * @param {{ prisma: import('@prisma/client').PrismaClient }}
 * @returns {object} The user repository object.
 */

export function makeAuthRepository({ prisma }) {
  return {
    /**
     * Finds a user by their uniq ID
     * @param {string} id - The ID of the user
     * @returns {Promise<object|null>}  The user object or null if not found.
     *
     * @remarks
     * **Note:** This method returns *all* columns (including `password_hash`).
     */
    async findById(id) {
      return prisma.user.findUnique({
        where: { id },
        include: {
          city: {
            select: {
              id: true,
              name: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });
    },
    async findByEmail(email) {
      return prisma.user.findUnique({
        where: { email },
      });
    },
    async findByEmailIsUsing(email,) {
      return prisma.user.findUnique({
        where: { email, passwordHash: { not: null } },
      });
    },

    async findByEmailRegistered(email) {
      return prisma.user.findUnique({
        where: { email, passwordHash: null },
      });
    },

    async findByPasswordResetToken(token) {
      return prisma.user.findUnique({
        where: { passwordResetToken: token },
      });
    },

    async findByUsername(username) {
      return prisma.user.findUnique({
        where: { username },
      });
    },
    async findRoleByName(name) {
      return prisma.role.findUnique({
        where: { name },
      });
    },
    async create(data) {
      return prisma.user.create({
        data,
      });
    },
    async findByVerificationToken(token) {
      return prisma.user.findUnique({
        where: { verificationToken: token },
      });
    },
  };
}
