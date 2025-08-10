import { z } from "zod";

export const paymentResultSchema = z
  .object({
    email_address: z
      .string()
      .min(1, { message: "payment email address is required." }),
    id: z.string().min(1, { message: "payment ID is required." }),
    status: z.string().min(1, { message: "payment status is required." }),
    update_time: z.date(),
  })
  .optional();
