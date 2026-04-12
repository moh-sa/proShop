import { z } from "zod";

import {
	objectIdStringValidator,
	objectIdValidator,
	uuidValidator,
} from "../../validators/index.js";

const baseSchema = z.object({
	expiresAt: z.date(),
	revokedAt: z.date().nullable(),
	tokenId: uuidValidator("Token ID"),
	userId: objectIdStringValidator,
});

export const createSessionSchema = baseSchema.partial({
	revokedAt: true,
});

export const sessionSchema = baseSchema.extend({
	createdAt: z.date(),
	id: objectIdStringValidator,
	updatedAt: z.date(),
});

export const sessionModelSchema = sessionSchema.extend({
	id: objectIdValidator,
	userId: objectIdValidator,
});
