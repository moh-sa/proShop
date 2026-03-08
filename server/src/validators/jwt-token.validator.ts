import { z } from "zod";

export const jwtTokenValidator = z
	.string()
	.trim()
	.pipe(z.jwt({ error: "Invalid jwt token format." }));
