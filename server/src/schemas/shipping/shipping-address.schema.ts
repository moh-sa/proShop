import { z } from "zod";
import { nonEmptyStringValidator } from "../../validators/non-empty-string.validator.js";

export const shippingAddressSchema = z.object({
	address: nonEmptyStringValidator("address"),
	city: nonEmptyStringValidator("city"),
	country: nonEmptyStringValidator("country"),
	postalCode: nonEmptyStringValidator("postal code"),
});
