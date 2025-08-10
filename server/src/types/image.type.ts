import type { z } from "zod";

import type { insertImageSchema, selectImageSchema } from "../schemas/index.js";

export type InsertImage = z.infer<typeof insertImageSchema>;
export type SelectImage = z.infer<typeof selectImageSchema>;
