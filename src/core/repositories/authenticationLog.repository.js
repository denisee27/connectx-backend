export function makeAuthenticationLogRepository({ prisma }) {
  return {
    async createLog({ userId = null, event, ipAddress, userAgent, metadata }) {
      return prisma.authenticationLog.create({
        data: {
          userId,
          event,
          ipAddress,
          userAgent,
          ...(metadata ? { metadata } : {}),
        },
      });
    },
  };
}
