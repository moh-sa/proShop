import { z } from "zod";

import { IMAGE_SIZE_LIMIT, IMAGE_TYPE_LIMIT } from "../../constants/index.js";
import { nonEmptyStringValidator } from "../../validators/non-empty-string.validator.js";
import { urlValidator } from "../../validators/url.validator.js";

export const insertImageSchema = z.object({
	buffer: z.unknown().refine((val): val is Buffer => Buffer.isBuffer(val), {
		error: "Invalid buffer",
	}),

	encoding: nonEmptyStringValidator,

	fieldname: nonEmptyStringValidator,

	mimetype: nonEmptyStringValidator.refine(
		(val) => IMAGE_TYPE_LIMIT.includes(val),
		{
			error: `Invalid image type. Allowed types: ${IMAGE_TYPE_LIMIT.map((val) =>
				val.replace("image/", ""),
			).join(", ")}`,
		},
	),

	originalname: nonEmptyStringValidator,

	size: z
		.number()
		.positive()
		.max(IMAGE_SIZE_LIMIT, { error: "Image size should not exceed 5MB" }),
});

export const selectImageSchema = urlValidator;
