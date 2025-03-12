import { z } from "zod";

export function removeEmptyFieldsSchema<T extends z.ZodObject<any>>(schema: T) {
  return z.preprocess((obj) => {
    if (typeof obj !== "object" || obj === null) return {};

    return Object.fromEntries(
      Object.entries(obj).filter(([_, value]) => value !== ""),
    );
  }, schema.partial());
}
