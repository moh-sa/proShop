import { z } from "zod";

import {
	jwtTokenValidator,
	objectIdValidator,
} from "../../validators/index.js";

const baseSessionSchema = z.object({
	expiresAt: z.date(),
	revokedAt: z.date().nullable().default(null),
	tokenId: jwtTokenValidator,
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
