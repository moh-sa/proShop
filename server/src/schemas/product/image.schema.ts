import { z } from "zod";

import { IMAGE_SIZE_LIMIT, IMAGE_TYPE_LIMIT } from "../../constants/index.js";
import { nonEmptyStringValidator } from "../../validators/non-empty-string.validator.js";

export const insertImageSchema = z.object({
	buffer: z.unknown().refine((val): val is Buffer => Buffer.isBuffer(val), {
		message: "Invalid buffer",
	}),

	encoding: nonEmptyStringValidator("encoding"),

	fieldname: nonEmptyStringValidator("fieldname"),

	mimetype: nonEmptyStringValidator("mimetype").refine(
		(val) => IMAGE_TYPE_LIMIT.includes(val),
		{
			message: `Invalid image type. Allowed types: ${IMAGE_TYPE_LIMIT.map(
				(val) => val.replace("image/", ""),
			).join(", ")}`,
		},
	),

	originalname: nonEmptyStringValidator("originalname"),

	size: z
		.number()
		.positive()
		.max(IMAGE_SIZE_LIMIT, { message: "Image size should not exceed 5MB" }),
});

export const selectImageSchema = nonEmptyStringValidator("image").url({
	message: "Invalid image URL",
});
