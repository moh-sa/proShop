import { z } from "zod";

import {
	nonEmptyStringValidator,
	uuidValidator,
} from "../../validators/index.js";

export const tokenResultSchema = z.object({
	expiresAt: z.date().refine((date) => date.getTime() > Date.now(), {
		error: "Token expiration date must be in the future",
	}),
	token: nonEmptyStringValidator("Token"),
	tokenId: uuidValidator("Token ID"),
});
