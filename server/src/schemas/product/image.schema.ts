import { z } from "zod";
import { IMAGE_SIZE_LIMIT, IMAGE_TYPE_LIMIT } from "../../constants";

export const insertImageSchema = z.object({
  fieldname: z.string().min(1),
  originalname: z.string().min(1),
  encoding: z.string().min(1),
  mimetype: z.string().refine((val) => IMAGE_TYPE_LIMIT.includes(val), {
    message: `Invalid image type. Allowed types: ${IMAGE_TYPE_LIMIT.map((val) =>
      val.replace("image/", ""),
    ).join(", ")}`,
  }),
  buffer: z.instanceof(Buffer).refine((buffer) => buffer.length > 0, {
    message: "File buffer must not be empty",
  }),
  size: z
    .number()
    .positive()
    .max(IMAGE_SIZE_LIMIT, { message: "Image size should not exceed 5MB" }),
});

export const selectImageSchema = z
  .string()
  .min(1, { message: "Image is required" })
  .url({ message: "Invalid image URL" });
