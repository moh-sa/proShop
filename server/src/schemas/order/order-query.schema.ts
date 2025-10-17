import { z } from "zod";

import { removeEmptyFields } from "../../utils/index.js";
import {
	objectIdValidator,
	stringToStrictBooleanValidator,
} from "../../validators/index.js";

export const orderQuerySchema = z
	.object({
		isDelivered: stringToStrictBooleanValidator.optional(),
		isPaid: stringToStrictBooleanValidator.optional(),
		user: objectIdValidator.optional(),
	})
	.transform(removeEmptyFields);
