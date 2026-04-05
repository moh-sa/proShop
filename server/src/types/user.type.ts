import type { z } from "zod";

import type { UserModel } from "../models/user.model.js";
import type {
	createUserSchema,
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
export type User = z.infer<typeof userSchema>;
export type UserDocument = ReturnType<(typeof UserModel)["hydrate"]>;
export type UserSchema = User;

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
};

export type GetAllUsersServiceParams = PaginationParamsStringified & {
	filters?: Stringify<UserFilter>;
	sort?: string;
};
