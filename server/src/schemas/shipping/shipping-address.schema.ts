import { z } from "zod";

import { nonEmptyStringValidator } from "../../validators/non-empty-string.validator.js";

export const shippingAddressSchema = z.object({
	address: nonEmptyStringValidator,
	city: nonEmptyStringValidator,
	country: nonEmptyStringValidator,
	postalCode: nonEmptyStringValidator,
});
