import { Types } from "mongoose";
import { z } from "zod";

export const objectIdValidator = z.preprocess((val) => {
  if (val instanceof Types.ObjectId) return val;

  if (typeof val === "string") {
    const trimmed = val.trim();

    if (Types.ObjectId.isValid(trimmed)) {
      return new Types.ObjectId(trimmed);
    }
  }

  return val;
}, z.instanceof(Types.ObjectId, { message: "Invalid ObjectId format." }));
