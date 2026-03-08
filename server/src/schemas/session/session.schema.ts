import { z } from "zod";

import { objectIdValidator, uuidValidator } from "../../validators/index.js";

const baseSessionSchema = z.object({
	expiresAt: z.date(),
	revokedAt: z.date().nullable(),
	tokenId: uuidValidator("Token ID"),
	userId: objectIdValidator,
});

export const insertSessionSchema = baseSessionSchema.partial({
	revokedAt: true,
});

export const selectSessionSchema = baseSessionSchema.extend({
	createdAt: z.date(),
	id: objectIdValidator,
	updatedAt: z.date(),
});
