import { Types } from "mongoose";
import { z } from "zod";

import { nonEmptyStringValidator } from "./non-empty-string.validator.js";

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

export const objectIdStringValidator = (fieldName: string) =>
	nonEmptyStringValidator(fieldName).refine(
		(val) => Types.ObjectId.isValid(val),
		{
			error: `Invalid ${fieldName} format.`,
		},
	);
