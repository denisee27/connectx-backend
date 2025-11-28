import midtransClient from "midtrans-client";
import crypto from "crypto";

export const makeMidtransClient = ({ env }) => {
  if (!env.MIDTRANS_SERVER_KEY || !env.MIDTRANS_CLIENT_KEY) {
    // Return null so service can throw a friendly error when invoked without keys
    return null;
  }

  return new midtransClient.Snap({
    isProduction: false,
    serverKey: env.MIDTRANS_SERVER_KEY,
  });
};

export const verifyMidtransSignature = ({
  orderId,
  statusCode,
  grossAmount,
  signature,
  serverKey,
}) => {
  const expected = crypto
    .createHash("sha512")
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest("hex");
  return expected === signature;
};

export const resolveVaNumber = (payload) => {
  const list = payload?.va_numbers;
  if (Array.isArray(list) && list.length) {
    return list[0]?.va_number || null;
  }
  return payload?.permata_va_number || payload?.permata_va || null;
};
