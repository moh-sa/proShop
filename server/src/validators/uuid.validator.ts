import { z } from "zod";

export const uuidValidator = z
	.string()
	.trim()
	.pipe(
		z.uuid({
			error: (ctx) => {
				const path = ctx.path?.join(".") || "";
				return ` ${path} is invalid uuid format.`;
			},
		}),
	);
