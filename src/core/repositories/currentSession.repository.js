export function makeCurrentSessionRepository({ prisma }) {
  return {
    async getCurrentSession() {
      return prisma.currentSession.findFirst();
    },

    async saveEncryptedSession(encryptedValue) {
      const existing = await prisma.currentSession.findFirst();
      if (existing) {
        return prisma.currentSession.update({
          where: { id: existing.id },
          data: { currentSession: encryptedValue },
        });
      }
      return prisma.currentSession.create({
        data: { currentSession: encryptedValue },
      });
    },
  };
}
