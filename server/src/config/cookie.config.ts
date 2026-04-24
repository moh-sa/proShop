import type { CookieConfig } from "../types/index.js";
import { env } from "./env.js";

export const DEFAULT_COOKIE_CONFIG: CookieConfig = {
	domain: env.NODE_ENV === "production" ? env.CLIENT_URL : "localhost",
	encode: encodeURIComponent,
	httpOnly: true,
	path: "/",
	sameSite: "none",
	secure: env.NODE_ENV === "production",
	signed: true,
};
