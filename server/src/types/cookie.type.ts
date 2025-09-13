import type { CookieOptions as ExpressCookieOptions } from "express";

import type { CookieName } from "../constants/index.js";

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
