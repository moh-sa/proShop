import type { NextFunction, Request, Response } from "express";

import type { AsyncRequestHandler } from "../types/async-handler.type.js";

/**
 * Wraps an async Express handler so errors are automatically passed to `next()`.
 *
 * @template ReqBody Type of `req.body`
 * @template ResBody Type of `res.json()`
 * @template Params  Type of `req.params`
 * @template Query   Type of `req.query`
 * @template Locals  Type of `res.locals`
 */
export function asyncHandler<
	ReqBody = unknown,
	ResBody = unknown,
	Params = unknown,
	Query = unknown,
	Locals extends Record<string, unknown> = Record<string, unknown>,
>(fn: AsyncRequestHandler<ReqBody, ResBody, Params, Query, Locals>) {
	return async function (
		req: Request<
			Partial<Params>,
			ResBody,
			Partial<ReqBody>,
			Partial<Query>,
			Locals
		>,
		res: Response<ResBody, Locals>,
		next: NextFunction,
	) {
		try {
			await fn(req, res, next);
		} catch (error) {
			next(error);
		}
	};
}
