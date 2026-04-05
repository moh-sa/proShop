import { paginationParamsSchema } from "../pagination/pagination.schema.js";
import { createPaginationSortSchema } from "../pagination/sort.schema.js";
import { userSchema } from "./user.schema.js";

export const userPaginationFiltersSchema = userSchema
	.pick({
		email: true,
		isAdmin: true,
		name: true,
	})
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
