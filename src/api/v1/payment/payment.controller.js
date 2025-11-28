export default {
  async createPayment(req, res, next) {
    try {
      const paymentService = req.scope.resolve("paymentService");
      const { amount, items = [], metadata = {}, customer = {} } = req.validated?.body || req.body;
      const result = await paymentService.createPayment({
        userId: req.user?.userId,
        amount,
        items,
        metadata,
        customer,
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getPaymentStatus(req, res, next) {
    try {
      const paymentService = req.scope.resolve("paymentService");
      const { orderId } = req.params;
      const payment = await paymentService.getPaymentStatus({ orderId });

      if (!payment) {
        return res.status(404).json({ success: false, error: "Payment not found" });
      }

      res.status(200).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  },

  async handleMidtransWebhook(req, res, next) {
    try {
      const paymentService = req.scope.resolve("paymentService");
      await paymentService.handleWebhook({ payload: req.body });
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  },
};
