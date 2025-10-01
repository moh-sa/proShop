import { z } from "zod";

import { tokenResultSchema } from "./token-result.schema.js";

export const tokenPairSchema = z.object({
	access: tokenResultSchema,
	refresh: tokenResultSchema,
});
