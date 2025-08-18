import { z } from "zod";

import {
	jwtTokenValidator,
	objectIdValidator,
} from "../../validators/index.js";

const baseSessionSchema = z.object({
	expiresAt: z.date(),
	revokedAt: z.date().nullable(),
	tokenId: jwtTokenValidator,
	userId: objectIdValidator,
});

export const insertSessionSchema = baseSessionSchema;
export const selectSessionSchema = baseSessionSchema.extend({
	createdAt: z.date(),
	id: objectIdValidator,
	updatedAt: z.date(),
});
