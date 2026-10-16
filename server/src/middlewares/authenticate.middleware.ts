import { SESSION_COOKIE_NAME } from "../constants/index.js";
import {
	AuthenticationError,
	CookieNotFoundError,
	NotFoundError,
} from "../errors/index.js";
import { sessionTokenSchema } from "../schemas/index.js";
import { cookieService } from "../services/cookie.service.js";
import { sessionService } from "../services/session.service.js";
import { userService } from "../services/user.service.js";
import { asyncHandler } from "../utils/async-handler.util.js";

/**
 * Authenticate Middleware
 *
 * Resolves the session cookie to a live session and its user, and sets
 * `res.locals.session` and `res.locals.user`.
 *
 * When the session has ended it clears the cookie, so the browser stops sending
 * a dead token. Database errors pass through untouched: an outage must not
 * sign everyone out.
 */
export const authenticate = asyncHandler(async (req, res, next) => {
	const cookieResult = cookieService.get({
		name: SESSION_COOKIE_NAME,
		request: req,
		schema: sessionTokenSchema,
	});
	if (!cookieResult.success) {
		// present but malformed: clear it so the browser stops sending it
		if (!(cookieResult.error instanceof CookieNotFoundError)) {
			cookieService.delete({ name: SESSION_COOKIE_NAME, response: res });
		}
		return next(
			new AuthenticationError("Authentication required. Please sign in."),
		);
	}

	const sessionResult = await sessionService.validate({
		token: cookieResult.data,
	});
	if (!sessionResult.success) {
		if (sessionResult.error instanceof AuthenticationError) {
			cookieService.delete({ name: SESSION_COOKIE_NAME, response: res });
		}
		return next(sessionResult.error);
	}

	const userResult = await userService.getById({
		userId: sessionResult.data.userId,
	});
	if (!userResult.success) {
		if (!(userResult.error instanceof NotFoundError)) {
			return next(userResult.error);
		}

		// the user was deleted while the session was still alive
		await sessionService.deleteById({ sessionId: sessionResult.data.id });
		cookieService.delete({ name: SESSION_COOKIE_NAME, response: res });
		return next(
			new AuthenticationError("Authentication required. Please sign in."),
		);
	}

	// a ban deletes all sessions; this catches one created while the ban was being applied
	if (userResult.data.bannedAt) {
		await sessionService.deleteAllByUserId({ userId: userResult.data.id });
		cookieService.delete({ name: SESSION_COOKIE_NAME, response: res });
		return next(
			new AuthenticationError("Authentication required. Please sign in."),
		);
	}

	res.locals.session = sessionResult.data;
	res.locals.user = userResult.data;

	next();
});
