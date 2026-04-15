import type { NextFunction, Request, Response } from "express";
import { createMocks } from "node-mocks-http";

/** Express-style handler shape `(req, res, next)` used only for type inference. */
type ExpressHandlerLike = (
	// 'never' is only a placeholder to satisfy the type checker
	// actual types are inferred from the passed handler
	req: never,
	res: never,
	next: NextFunction,
) => void | Promise<void>;

/** `req` type inferred from handler */
type RequestFromHandler<Handler extends ExpressHandlerLike> =
	Parameters<Handler>[0];

/**
 * `res` type inferred from the handler.
 */
type RawResponseFromHandler<Handler extends ExpressHandlerLike> =
	Parameters<Handler>[1];

/** Type passed to `res.json(...)` inferred from the handler's `res`, or `unknown`. */
type JsonBodyFromHandler<Handler extends ExpressHandlerLike> =
	RawResponseFromHandler<Handler> extends {
		json: (body: infer Body) => unknown;
	}
		? Body
		: unknown;

/**
 * `res` type inferred from the handler. Extends the response with the handler's JSON body type.
 */
type ResponseFromHandler<Handler extends ExpressHandlerLike> =
	RawResponseFromHandler<Handler> & {
		_getJSONData: () => JsonBodyFromHandler<Handler>;
	};

function baseMockContext<TReq extends Request, TRes extends Response>() {
	const { req, res } = createMocks<TReq, TRes>();

	const next: NextFunction = (error) => {
		if (error) {
			throw error;
		}
	};

	return { next, req, res };
}

/**
 * Creates `req` / `res` / `next` with the Express's default `Request` and `Response` types.
 *
 * Prefer {@link createMockExpressContextFromHandler} when you want typed `res` and `_getJSONData()`.
 */
export function createMockExpressContext() {
	return baseMockContext<Request, Response>();
}

/**
 * Creates `req` / `res` / `next` with inferred types from the passed handler.
 *
 * Prefer {@link createMockExpressContext} when you don't need typed `res` and `_getJSONData()`.
 *
 * @example
 * ```ts
 * async function greetingController(req: Request, res: Response) {
 *   res.status(200).json({ message: `Hello, ${req.query.userName}!` });
 * }
 *
 * const { req, res, next } = createMockExpressContextFromHandler(greetingController);
 * req.query = { userName: "Yahya" };
 *
 * await greetingController(req, res, next);
 *
 * assert.strictEqual(
 *    res._getJSONData().message, // type inferred from handler
 *    "Hello, Yahya!"
 * )
 * ```
 */
export function createMockExpressContextFromHandler<
	Handler extends ExpressHandlerLike,
>(_handlerRef?: Handler) {
	return baseMockContext<
		RequestFromHandler<Handler>,
		ResponseFromHandler<Handler>
	>();
}
