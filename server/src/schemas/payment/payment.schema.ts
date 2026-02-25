import { z } from "zod";

export const paymentProviderSchema = z.enum(["stripe", "paypal"]);
