import type { z } from "zod";

import type User from "../models/user.model.js";
import type {
	insertUserSchema,
	selectUserSchema,
	userPaginationFiltersSchema,
	userPaginationSortSchema,
} from "../schemas/index.js";
import type { PaginationFilter, PaginationSelect } from "./pagination.type.js";

export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;
export type UserDocument = ReturnType<(typeof User)["hydrate"]>;
export type UserSchema = SelectUser;

// SAFE/UNSAFE user types
export type SafeSelectUser = Omit<SelectUser, "password">;
export type UnSafeSelectUser = SelectUser;

// Pagination
export type UserFilter = PaginationFilter<
	z.infer<typeof userPaginationFiltersSchema>
>;

export type UserSelect = PaginationSelect<SelectUser>;

export type UserSort = z.infer<typeof userPaginationSortSchema>;
