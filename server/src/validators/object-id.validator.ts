import { Types } from "mongoose";
import { z } from "zod";

export const objectIdValidator = z.preprocess(
	(val) => {
		if (val instanceof Types.ObjectId) {
			return val;
		}

		if (typeof val === "string") {
			const trimmed = val.trim();

			if (Types.ObjectId.isValid(trimmed)) {
				return new Types.ObjectId(trimmed);
			}
		}

		return val;
	},
	z.instanceof(Types.ObjectId, { error: "Invalid ObjectId format." }),
);

export const objectIdStringValidator = z
	.hex({ error: "invalid id." })
	.trim()
	.length(24, { error: "invalid id." });
