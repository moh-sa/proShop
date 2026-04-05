import { z } from "zod";

import {
	objectIdStringValidator,
	uuidValidator,
} from "../../validators/index.js";
import { tokenTypeSchema } from "./token-type.schema.js";

export const tokenDecodedSchema = z.object({
	exp: z.number().int().positive(),
	iat: z.number().int().positive(),
	tokenId: uuidValidator("Token ID"),
	type: tokenTypeSchema,
	userId: objectIdStringValidator,
});
