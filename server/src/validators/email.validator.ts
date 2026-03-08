import { z } from "zod";

export const emailValidator = z
	.string()
	.trim()
	.toLowerCase()
	.pipe(z.email({ error: "Invalid email format." }));
