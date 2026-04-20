import { z } from "zod";

export const nonEmptyStringValidator = z
	.string()
	.trim()
	.nonempty({
		error: (ctx) => {
			const path = ctx.path?.join(".") || "";
			return ` ${path} is required`;
		},
	});
