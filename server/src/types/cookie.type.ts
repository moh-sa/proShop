import type { CookieOptions as ExpressCookieOptions } from "express";
import type z from "zod";

import type { cookieNameSchema } from "../schemas/index.js";

export type CookieName = z.infer<typeof cookieNameSchema>;

export type CookieConfig = ExpressCookieOptions;

export interface CookieItem {
	name: CookieName;
	value: unknown;
}

export interface CookieItemOptions {
	expires?: Date;
	httpOnly?: boolean;
	maxAge?: number;
}
