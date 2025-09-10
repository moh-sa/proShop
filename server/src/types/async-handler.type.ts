import type { RequestHandler } from "express";

/**
 * Express async request handler type.
 *
 * @template ReqBody Type of `req.body`
 * @template ResBody Type of `res.json()`
 * @template Params  Type of `req.params`
 * @template Query   Type of `req.query`
 * @template Locals  Type of `res.locals`
 */
export type AsyncRequestHandler<
	ReqBody = unknown,
	ResBody = unknown,
	Params = unknown,
	Query = unknown,
	Locals extends Record<string, unknown> = Record<string, unknown>,
> = RequestHandler<Params, ResBody, ReqBody, Query, Locals>;
