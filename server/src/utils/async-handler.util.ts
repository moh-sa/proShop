import type { Request, Response } from "express";

import type {
	AsyncHandlerGenerics,
	AsyncRequestHandler,
	StrictAsyncHandler,
} from "../types/async-handler.type.js";

/**
 * Wraps an async Express handler so errors are automatically passed to `next()`.
 *
 * @template ReqBody Type of `req.body`
 * @template ResData Type of `res.json({data})`
 * @template ResMeta Type of `res.json({meta})`
 * @template Params  Type of `req.params`
 * @template Query   Type of `req.query`
 * @template Locals  Type of `res.locals`
 */
export function asyncHandler<
	ReqBody = Request["body"],
	ResData = Record<string, unknown>,
	ResMeta = Record<string, unknown>,
	Params = Request["params"],
	Query = Request["query"],
	Locals = Response["locals"],
>(
	fn: AsyncRequestHandler<ReqBody, ResData, ResMeta, Params, Query, Locals>,
): AsyncRequestHandler<ReqBody, ResData, ResMeta, Params, Query, Locals> {
	return async function asyncHandlerWrapper(req, res, next) {
		try {
			await fn(req, res, next);
		} catch (error) {
			next(error);
		}
	};
}

/**
 * Wraps async Express handlers to ensure proper error handling
 * Automatically catches any thrown errors and passes them to Express error middleware
 *
 * @param fn - The async handler function to wrap
 * @returns A wrapped handler with automatic error catching
 * @example
 * ```ts
 * strictAsyncHandler<{
 * 	params: { id: string };
 * 	query: { page: string };
 * 	reqBody: { name: string };
 * 	resBody: { data: { user: SafeUser }; meta: { timestamp: string } };
 * }>(async (req, res, _next) => {
 * 	req.body.name;
 * 	req.query.page;
 * 	req.params.id;
 *
 * 	res.json({
 * 		data: { user: SafeUser },
 * 		meta: { timestamp: Date().toISOString() },
 * 		success: true,
 * 	});
 * });
 */
export function strictAsyncHandler<G extends AsyncHandlerGenerics>(
	fn: StrictAsyncHandler<G>,
): StrictAsyncHandler<G> {
	return async function asyncHandlerWrapper(req, res, next) {
		try {
			await fn(req, res, next);
		} catch (error) {
			// Ensure error is an Error object for consistent handling
			const processedError =
				error instanceof Error ? error : new Error(String(error));

			next(processedError);
		}
	};
}
