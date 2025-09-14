import type { RequestHandler } from "express";

import type { ApiResponse } from "./api-response.type.js";

/**
 * Express async request handler type.
 *
 * @template ReqBody Type of `req.body`
 * @template ResData Type of `res.json({data})`
 * @template ResMeta Type of `res.json({meta})`
 * @template Params  Type of `req.params`
 * @template Query   Type of `req.query`
 * @template Locals  Type of `res.locals`
 */
export type AsyncRequestHandler<
	ReqBody = unknown,
	ResData = Record<string, unknown>,
	ResMeta = Record<string, unknown>,
	Params = unknown,
	Query = unknown,
	Locals extends Record<string, unknown> = Record<string, unknown>,
> = RequestHandler<
	Partial<Params>,
	ApiResponse<ResData, ResMeta>,
	Partial<ReqBody>,
	Partial<Query>,
	Locals
>;
