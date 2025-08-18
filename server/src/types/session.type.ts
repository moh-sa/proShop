import type { Document } from "mongoose";
import type { z } from "zod";

import type {
	insertSessionSchema,
	selectSessionSchema,
} from "../schemas/index.js";

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type SelectSession = z.infer<typeof selectSessionSchema>;
export type SessionSchema = Document & SelectSession;
