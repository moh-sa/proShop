import { z } from "zod";

export const shippingAddressSchema = z.object({
  address: z.string().min(1, { message: "Address is required." }),
  city: z.string().min(1, { message: "City is required." }),
  postalCode: z.string().min(1, { message: "Postal code is required." }),
  country: z.string().min(1, { message: "Country is required." }),
});
