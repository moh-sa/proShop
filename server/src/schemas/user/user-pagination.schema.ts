import { selectUserSchema } from "./user.schema.js";

export const userPaginationFiltersSchema = selectUserSchema
	.pick({
		email: true,
		isAdmin: true,
		name: true,
	})
	.partial();
