import { z } from "zod";

const unexpectedFieldMessage =
  "Unexpected field(s) provided. Please contact us before sending additional data.";

export const loginSchema = z
  .object({
    body: z
      .object({
        email: z.email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      })
      .strict({ message: unexpectedFieldMessage }),
  })
  .strict({ message: unexpectedFieldMessage });

export const refreshTokenSchema = z
  .object({
    body: z.object({}).strict({ message: unexpectedFieldMessage }).optional(),
  })
  .strict({ message: unexpectedFieldMessage });

export const registerationSchema = z
  .object({
    body: z
      .object({
        email: z.email("Invalid email address"),
        name: z.string().min(3, "Name must be at least 3 characters"),
        phoneNumber: z.string().min(10, "Phone number must be at least 12 characters").optional(),
        bornDate: z.string().min(10, "Born date is required."),
        gender: z.string().min(1, "Gender is required."),
        occupation: z.string().min(1, "Occupation is required."),
        countryId: z.string().min(1, "Country is required."),
        cityId: z.string().min(1, "City is required."),
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
      })
      .strict({ message: unexpectedFieldMessage }),
  })
  .refine((data) => data.body.password === data.body.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .strict({ message: unexpectedFieldMessage });


export const verifyEmailSchema = z
  .object({
    body: z
      .object({
        token: z.string().trim().min(1, "Token is required"),
      })
      .strict({ message: unexpectedFieldMessage }),
  })
  .strict({ message: unexpectedFieldMessage });
