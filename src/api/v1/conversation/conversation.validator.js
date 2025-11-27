import { z } from "zod";

const unexpectedFieldMessage =
  "Unexpected field(s) provided. Please contact us before sending additional data.";

export const chattingSchema = z
  .object({
    body: z
      .object({
        message: z.string().min(1, "Password is required"),
      })
      .strict({ message: unexpectedFieldMessage }),
  })
  .strict({ message: unexpectedFieldMessage });
