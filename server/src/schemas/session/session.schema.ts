import { z } from "zod";

import { objectIdValidator, uuidValidator } from "../../validators/index.js";

const baseSchema = z.object({
	expiresAt: z.date(),
	revokedAt: z.date().nullable(),
	tokenId: uuidValidator("Token ID"),
	userId: objectIdValidator,
});

export const createSessionSchema = baseSchema.partial({
	revokedAt: true,
});

export const sessionSchema = baseSchema.extend({
	createdAt: z.date(),
	id: objectIdValidator,
	updatedAt: z.date(),
});
