import type { z } from "zod";

import type { insertUserSchema, selectUserSchema } from "../schemas/index.js";
import type { PaginationParamsString } from "./pagination.type.js";

export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;
export type UserSchema = SelectUser;

// SAFE/UNSAFE user types
export type SafeSelectUser = Omit<SelectUser, "password">;
export type UnSafeSelectUser = SelectUser;

// Pagination
export type UserPaginationParams = Omit<
	PaginationParamsString,
	"pipeline" | "query"
> & {
	email?: string;
	isAdmin?: string;
	name?: string;
};
