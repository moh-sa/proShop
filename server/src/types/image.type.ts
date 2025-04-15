import { z } from "zod";
import { insertImageSchema, selectImageSchema } from "../schemas";

export type InsertImage = z.infer<typeof insertImageSchema>;
export type SelectImage = z.infer<typeof selectImageSchema>;
