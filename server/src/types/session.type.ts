import type { z } from "zod";

import type {
	createSessionSchema,
	sessionModelSchema,
	sessionSchema,
} from "../schemas/index.js";

export type CreateSession = z.infer<typeof createSessionSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type SessionSchema = z.infer<typeof sessionModelSchema>;

// what a user sees about their own sessions - never the token hash
export type PublicSession = Pick<
	Session,
	"createdAt" | "id" | "lastSeenAt" | "userAgent"
> & { isCurrent: boolean };
