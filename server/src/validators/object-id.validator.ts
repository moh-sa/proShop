import { Types } from "mongoose";
import { z } from "zod";

export const objectIdValidator = z.union([
  z.instanceof(Types.ObjectId, { message: "Invalid ObjectId format." }),
  z
    .string()
    .min(1, { message: "Required field is missing." })
    .refine(Types.ObjectId.isValid, { message: "Invalid ObjectId format." })
    .transform((id) => new Types.ObjectId(id)),
]);
