import { z } from "zod";

import { removeEmptyFields } from "../../utils/index.js";
import { objectIdValidator } from "../../validators/index.js";
import { orderStatusSchema } from "./order.schema.js";

export const orderQuerySchema = z
	.object({
		status: orderStatusSchema.optional(),
		user: objectIdValidator.optional(),
	})
	.transform(removeEmptyFields);
