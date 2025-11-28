export const safePaymentSelect = {
  id: true,
  orderId: true,
  userId: true,
  amount: true,
  currency: true,
  status: true,
  method: true,
  midtransId: true,
  vaNumber: true,
  metadata: true,
  webhookPayload: true,
  paidAt: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
};

export function makePaymentRepository({ prisma }) {
  return {
    findByOrderId(orderId) {
      return prisma.payment.findUnique({
        where: { orderId },
        select: safePaymentSelect,
      });
    },

    create(data) {
      return prisma.payment.create({
        data,
        select: safePaymentSelect,
      });
    },

    updateByOrderId(orderId, data) {
      return prisma.payment.update({
        where: { orderId },
        data,
        select: safePaymentSelect,
      });
    },
  };
}
