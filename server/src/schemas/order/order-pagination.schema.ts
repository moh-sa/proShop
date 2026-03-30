import { isValidObjectId } from "mongoose";
import { z } from "zod";

import { emptyStringToUndefinedSchema } from "../empty-string-to-undefined.schema.js";
import {
	createPaginationSortSchema,
	paginationParamsSchema,
} from "../pagination/index.js";
import { orderStatusSchema, selectOrderSchema } from "./order.schema.js";

export const orderPaginationFiltersSchema = z
	.object({
		status: orderStatusSchema.optional(),
		userId: emptyStringToUndefinedSchema.refine((v) => isValidObjectId(v), {
			message: "Invalid user ID",
		}),
	})
	.partial();

const orderSortableFields = selectOrderSchema.pick({
	createdAt: true,
	deliveredAt: true,
	updatedAt: true,
});

export const orderPaginationSortSchema = createPaginationSortSchema(
	orderSortableFields.keyof(),
);

export const orderPaginationParamsSchema = paginationParamsSchema.extend({
	filters: orderPaginationFiltersSchema.optional(),
	sort: orderPaginationSortSchema.optional(),
});
