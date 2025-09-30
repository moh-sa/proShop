import { Readable } from "node:stream";
import { z } from "zod";

import { IMAGE_SIZE_LIMIT, IMAGE_TYPE_LIMIT } from "../../constants/index.js";

export const insertImageSchema = z.object({
	buffer: z
		.unknown()
		.refine((val): val is Buffer => Buffer.isBuffer(val), {
			message: "Invalid buffer",
		}),
	destination: z.string().min(1),
	encoding: z.string().min(1),
	fieldname: z.string().min(1),
	filename: z.string().min(1),
	mimetype: z.string().refine((val) => IMAGE_TYPE_LIMIT.includes(val), {
		message: `Invalid image type. Allowed types: ${IMAGE_TYPE_LIMIT.map((val) =>
			val.replace("image/", ""),
		).join(", ")}`,
	}),

	originalname: z.string().min(1),
	path: z.string().min(1),
	size: z
		.number()
		.positive()
		.max(IMAGE_SIZE_LIMIT, { message: "Image size should not exceed 5MB" }),
	stream: z.instanceof(Readable),
});

export const selectImageSchema = z
	.string()
	.min(1, { message: "Image is required" })
	.url({ message: "Invalid image URL" });
