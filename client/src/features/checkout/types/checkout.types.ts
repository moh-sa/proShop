import type { z } from "zod";
import type { shippingAddressSchema } from "../schemas";

export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
