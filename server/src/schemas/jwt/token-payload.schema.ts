import { z } from "zod";

import { objectIdStringValidator } from "../../validators/index.js";
import { tokenTypeSchema } from "./token-type.schema.js";

export const tokenPayloadSchema = z.object({
	type: tokenTypeSchema,
	userId: objectIdStringValidator,
});
