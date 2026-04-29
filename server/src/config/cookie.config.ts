import type { CookieConfig } from "../types/index.js";

export const DEFAULT_COOKIE_CONFIG: CookieConfig = {
	encode: encodeURIComponent,
	httpOnly: true,
	path: "/",
	sameSite: "none",
	secure: true,
	signed: true,
};
