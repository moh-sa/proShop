import type { CookieConfig } from "../types/index.js";
import { env } from "./env.js";

export const DEFAULT_COOKIE_CONFIG: CookieConfig = {
	encode: encodeURIComponent,
	httpOnly: true,
	path: "/",
	sameSite: "none",
	secure: env.NODE_ENV === "production",
	signed: true,
};
