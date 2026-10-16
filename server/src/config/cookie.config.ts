import type { CookieConfig } from "../types/index.js";

export const DEFAULT_COOKIE_CONFIG: CookieConfig = {
	encode: encodeURIComponent,
	httpOnly: true,
	path: "/",
	sameSite: "strict",
	secure: true,
	signed: false,
};
