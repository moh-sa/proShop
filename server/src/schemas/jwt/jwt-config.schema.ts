import { z } from "zod";

import { nonEmptyStringValidator } from "../../validators/non-empty-string.validator.js";

export const jwtConfigSchema = z.object({
	/**
	 * @description short lived token expressed in **`seconds`**
	 */
	accessTokenExpiresIn: z.number().int().positive(),
	accessTokenSecret: nonEmptyStringValidator,
	/**
	 * @description short lived token expressed in **`seconds`**
	 */
	refreshTokenExpiresIn: z.number().int().positive(),
	refreshTokenSecret: nonEmptyStringValidator,
});
