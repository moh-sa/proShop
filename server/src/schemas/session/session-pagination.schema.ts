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
