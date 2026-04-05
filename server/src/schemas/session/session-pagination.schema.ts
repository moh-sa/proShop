import { objectIdStringValidator } from "../../validators/object-id.validator.js";
import { paginationParamsSchema } from "../pagination/pagination.schema.js";
import { createPaginationSortSchema } from "../pagination/sort.schema.js";
import { selectSessionSchema } from "./session.schema.js";

export const sessionPaginationFiltersSchema = selectSessionSchema
	.pick({
		revokedAt: true,
		tokenId: true,
		userId: true,
	})
	.partial();

const sessionSortableFields = selectSessionSchema.pick({
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
