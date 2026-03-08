import { z } from "zod";

export const shippingAddressSchema = z.object({
	address: z.string().min(1, { error: "Address is required." }),
	city: z.string().min(1, { error: "City is required." }),
	country: z.string().min(1, { error: "Country is required." }),
	postalCode: z.string().min(1, { error: "Postal code is required." }),
});
