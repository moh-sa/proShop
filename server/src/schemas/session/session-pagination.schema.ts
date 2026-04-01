import { selectSessionSchema } from "./session.schema.js";

export const sessionPaginationFiltersSchema = selectSessionSchema
	.pick({
		revokedAt: true,
		tokenId: true,
		userId: true,
	})
	.partial();
