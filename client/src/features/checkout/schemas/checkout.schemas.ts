import { z } from "zod";

export const shippingAddressSchema = z.object({
	address: z.string().nonempty("Address is required"),
	city: z.string().nonempty("City is required"),
	postalCode: z.string().nonempty("Postal code is required"),
	country: z.string().nonempty("Country is required"),
});
