import crypto from "crypto";
import pkg from "@prisma/client";
import { ValidationError, UnauthorizedError } from "../errors/httpErrors.js";
import { verifyMidtransSignature, resolveVaNumber } from "../../infra/payment/midtrans.payment.js";

const { PaymentStatus } = pkg;

const toIntAmount = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    throw new ValidationError("Amount must be a positive number");
  }
  return Math.round(num);
};

const normalizeItems = (items = [], total) => {
  if (!Array.isArray(items) || !items.length) {
    return [
      {
        id: "default-item",
        name: "ConnectX payment",
        price: total,
        quantity: 1,
      },
    ];
  }

  return items.map((item, idx) => {
    const price = toIntAmount(item.price);
    const qty = Number(item.quantity ?? 1);
    const quantity = Number.isFinite(qty) && qty > 0 ? Math.round(qty) : 1;
    return {
      id: item.id || `item-${idx + 1}`,
      name: item.name || `Item ${idx + 1}`,
      price,
      quantity,
    };
  });
};

const buildCustomerDetails = (customer = {}) => ({
  first_name: customer.firstName || customer.first_name || "Guest",
  last_name: customer.lastName || customer.last_name || "",
  email: customer.email || "guest@example.com",
  phone: customer.phone || customer.phoneNumber || "",
});

const mapMidtransStatus = (transactionStatus, fraudStatus) => {
  const status = (transactionStatus || "").toLowerCase();
  switch (status) {
    case "capture":
      return fraudStatus === "challenge" ? PaymentStatus.PENDING : PaymentStatus.PAID;
    case "settlement":
      return PaymentStatus.SETTLED;
    case "pending":
      return PaymentStatus.PENDING;
    case "expire":
      return PaymentStatus.EXPIRED;
    case "cancel":
      return PaymentStatus.CANCELED;
    case "deny":
    case "failure":
    case "failed":
      return PaymentStatus.FAILED;
    default:
      return PaymentStatus.PENDING;
  }
};

const buildOrderId = (userId) => {
  const safeUser = (userId || "guest").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "guest";
  //const ts = Date.now().toString(36); // compact timestamp
  const rnd = Math.random().toString(36).slice(2, 6);
  // Midtrans order_id max length ~50; this stays well under the limit
  return `pay_${safeUser}_${rnd}`;
};

export function makePaymentService({ paymentRepository, midtransClient, env, logger }) {
  const ensureClient = () => {
    if (!midtransClient) {
      throw new ValidationError("Midtrans keys are not configured");
    }
    return midtransClient;
  };

  return {
    async createPayment({ userId, amount, items = [], customer = {}, metadata = {} }) {
      if (!userId) {
        throw new ValidationError("User is required to create a payment");
      }

      const grossAmount = toIntAmount(amount);
      const orderId = buildOrderId(userId);
      const client = ensureClient();

      const params = {
        transaction_details: {
          order_id: orderId,
          gross_amount: grossAmount,
        },
        credit_card: { secure: true },
        customer_details: buildCustomerDetails(customer),
        item_details: normalizeItems(items, grossAmount),
      };

      const transaction = await client.createTransaction(params);

      await paymentRepository.create({
        orderId,
        userId,
        amount: grossAmount,
        currency: "IDR",
        status: PaymentStatus.PENDING,
        metadata,
      });

      return {
        orderId,
        snapToken: transaction.token,
        redirectUrl: transaction.redirect_url,
        status: PaymentStatus.PENDING,
      };
    },

    async handleWebhook({ payload }) {
      const {
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: signature,
        transaction_status: transactionStatus,
        fraud_status: fraudStatus,
        payment_type: paymentType,
        transaction_id: transactionId,
        settlement_time: settlementTime,
        expiry_time: expiryTime,
      } = payload;

      const serverKey = env.MIDTRANS_WEBHOOK_SECRET || env.MIDTRANS_SERVER_KEY;
      if (!serverKey) {
        throw new UnauthorizedError("Midtrans server key is not configured");
      }

      const isValidSignature = verifyMidtransSignature({
        orderId,
        statusCode,
        grossAmount,
        signature,
        serverKey,
      });

      if (!isValidSignature) {
        throw new UnauthorizedError("Invalid Midtrans signature");
      }

      const payment = await paymentRepository.findByOrderId(orderId);
      if (!payment) {
        logger?.warn({ orderId }, "Payment not found for webhook");
        return null;
      }

      const status = mapMidtransStatus(transactionStatus, fraudStatus);
      const updateData = {
        status,
        method: paymentType || payment.method,
        midtransId: transactionId || payment.midtransId,
        vaNumber: resolveVaNumber(payload) || payment.vaNumber,
        webhookPayload: payload,
      };

      if (settlementTime && (status === PaymentStatus.SETTLED || status === PaymentStatus.PAID)) {
        updateData.paidAt = new Date(settlementTime);
      }

      if (expiryTime) {
        updateData.expiresAt = new Date(expiryTime);
      }

      return paymentRepository.updateByOrderId(orderId, updateData);
    },

    async getPaymentStatus({ orderId }) {
      return paymentRepository.findByOrderId(orderId);
    },
  };
}
