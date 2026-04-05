import { objectIdStringValidator } from "../../validators/object-id.validator.js";
import { paginationParamsSchema } from "../pagination/pagination.schema.js";
import { createPaginationSortSchema } from "../pagination/sort.schema.js";
import { sessionSchema } from "./session.schema.js";

export const sessionPaginationFiltersSchema = sessionSchema
	.pick({
		revokedAt: true,
		tokenId: true,
		userId: true,
	})
	.partial();

const sessionSortableFields = sessionSchema.pick({
	createdAt: true,
	revokedAt: true,
	updatedAt: true,
});

export const sessionPaginationSortSchema = createPaginationSortSchema(
	sessionSortableFields.keyof(),
);

export const sessionPaginationParamsSchema = paginationParamsSchema.extend({
	filters: sessionPaginationFiltersSchema.optional(),
	sort: sessionPaginationSortSchema.optional(),
});

export const sessionByUserIdPaginationParamsSchema =
	sessionPaginationParamsSchema.extend({
		userId: objectIdStringValidator,
	});
