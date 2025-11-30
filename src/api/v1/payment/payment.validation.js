import { z } from "zod";

const intNumber = z.preprocess(
  (val) => (typeof val === "string" ? Number(val) : val),
  z.number().int().positive()
);

const itemSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  price: intNumber,
  quantity: z
    .preprocess((val) => (typeof val === "string" ? Number(val) : val), z.number().int().positive())
    .optional(),
});

const customerSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const createPaymentSchema = z.object({
  body: z.object({
    roomId: z.string(),
    amount: intNumber,
    items: z.array(itemSchema).optional(),
    metadata: z.object({}).passthrough().optional(), // avoid z.record() bug in classic build
    customer: customerSchema.optional(),
  }),
});

export const getPaymentStatusSchema = z.object({
  params: z.object({
    orderId: z.string().min(1),
  }),
});
