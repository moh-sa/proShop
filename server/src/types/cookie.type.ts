import type { CookieOptions as ExpressCookieOptions } from "express";

export type CookieConfig = ExpressCookieOptions;

export interface CookieItem {
	name: string;
	value: unknown;
}

export interface CookieItemOptions {
	expires?: Date;
	httpOnly?: boolean;
	maxAge?: number;
}
