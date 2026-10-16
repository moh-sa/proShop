import { z } from "zod";

import { MAX_USER_AGENT_LENGTH } from "../../constants/index.js";
import {
	objectIdStringValidator,
	objectIdValidator,
} from "../../validators/index.js";

const baseSchema = z.object({
	expiresAt: z.date(),
	lastSeenAt: z.date(),
	// SHA-256 hex of the session token; the token itself is never stored
	tokenHash: z.string().length(64),
	userAgent: z.string().max(MAX_USER_AGENT_LENGTH),
	userId: objectIdStringValidator,
});

export const createSessionSchema = baseSchema;

export const sessionSchema = baseSchema.extend({
	createdAt: z.date(),
	id: objectIdStringValidator,
	updatedAt: z.date(),
});

export const sessionModelSchema = sessionSchema.extend({
	id: objectIdValidator,
	userId: objectIdValidator,
});
