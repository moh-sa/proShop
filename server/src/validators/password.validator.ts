import { z } from "zod";

import {
	MAX_PASSWORD_LENGTH,
	MIN_PASSWORD_LENGTH,
} from "../constants/password.constants.js";

export const passwordValidator = z.coerce
	.string()
	.trim()
	.min(MIN_PASSWORD_LENGTH, {
		error: `Password should be at least ${MIN_PASSWORD_LENGTH} characters long.`,
	})
	.max(MAX_PASSWORD_LENGTH, {
		error: `Password should be at most ${MAX_PASSWORD_LENGTH} characters long.`,
	});
