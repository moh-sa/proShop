import type { CookieOptions as ExpressCookieOptions } from "express";

import z from "zod";
import { cookieNameSchema } from "../schemas/index.js";

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
