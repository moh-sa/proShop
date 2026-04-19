import type { z } from "zod";

import type {
	createUserSchema,
	updateUserBodySchema,
	updateUserSchema,
	userModelSchema,
	userPaginationFiltersSchema,
	userPaginationParamsSchema,
	userPaginationSortSchema,
	userSchema,
} from "../schemas/index.js";
import type {
	PaginationFilter,
	PaginationParamsStringified,
	PaginationSelect,
} from "./pagination.type.js";
import type { Stringify } from "./stringify.type.js";

export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserBodyInput = z.infer<typeof updateUserBodySchema>;
export type User = z.infer<typeof userSchema>;
export type UserSchema = z.infer<typeof userModelSchema>;

// SAFE/UNSAFE user types
export type SafeSelectUser = Omit<User, "password">;
export type UnSafeSelectUser = User;

// Pagination
export type UserFilter = PaginationFilter<
	z.infer<typeof userPaginationFiltersSchema>
>;

export type UserSelect = PaginationSelect<User>;

export type UserSort = z.infer<typeof userPaginationSortSchema>;

// Method Params
export type GetAllUsersControllerParams = PaginationParamsStringified & {
	email?: string;
	isAdmin?: string;
	name?: string;
	sort?: string;
};

export type GetAllUsersRepositoryParams = z.infer<
	typeof userPaginationParamsSchema
> & {
	select?: UserSelect;
	sort?: UserSort;
};

export type GetAllUsersServiceParams = PaginationParamsStringified & {
	filters?: Stringify<UserFilter>;
	sort?: string;
};
