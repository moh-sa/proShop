import { z } from "zod";

import { objectIdStringValidator } from "../../validators/object-id.validator.js";
import {
	createPaginationSortSchema,
	paginationParamsSchema,
} from "../pagination/index.js";
import { orderSchema, orderStatusSchema } from "./order.schema.js";

export const orderPaginationFiltersSchema = z
	.object({
		status: orderStatusSchema.optional(),
		userId: objectIdStringValidator,
	})
	.partial();

const orderSortableFields = orderSchema.pick({
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
