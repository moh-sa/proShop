const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// `__Host-` makes the browser require Secure, Path=/ and no Domain
export const SESSION_COOKIE_NAME = "__Host-session";

// signed out after this long without a request (sliding)
export const SESSION_IDLE_TIMEOUT_MS = 7 * DAY_MS;

// signed out this long after sign-in, even when active
export const SESSION_ABSOLUTE_TIMEOUT_MS = 30 * DAY_MS;

// `lastSeenAt` is written at most this often
export const SESSION_TOUCH_INTERVAL_MS = HOUR_MS;

export const SESSION_TOKEN_BYTES = 32;

export const MAX_USER_AGENT_LENGTH = 512;
