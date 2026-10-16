import { z } from "zod";

import { paginationParamsSchema } from "../pagination/pagination.schema.js";
import { createPaginationSortSchema } from "../pagination/sort.schema.js";
import { userSchema } from "./user.schema.js";

export const userPaginationFiltersSchema = userSchema
	.pick({
		email: true,
		name: true,
	})
	.extend({ isAdmin: z.stringbool() }) // URL values are strings: "true" / "false"
	.partial();

const userSortableFields = userSchema.pick({
	createdAt: true,
	updatedAt: true,
});

export const userPaginationSortSchema = createPaginationSortSchema(
	userSortableFields.keyof(),
);

export const userPaginationParamsSchema = paginationParamsSchema.extend({
	filters: userPaginationFiltersSchema.optional(),
	sort: userPaginationSortSchema.optional(),
});
