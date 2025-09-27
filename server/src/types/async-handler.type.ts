import type { NextFunction, Request, RequestHandler, Response } from "express";

import type {
	ApiResponse,
	StrictApiResponse,
	StrictSuccessResponse,
} from "./api-response.type.js";

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
	ReqBody = Request["body"],
	ResData = Record<string, unknown>,
	ResMeta = Record<string, unknown>,
	Params = Request["params"],
	Query = Request["query"],
	Locals = Response["locals"],
> = RequestHandler<
	Params,
	ApiResponse<ResData, ResMeta>,
	ReqBody,
	Query,
	Locals extends Record<string, unknown> ? Locals : Record<string, unknown>
>;

/**
 * Enforces that at least one of `data` or `meta` is required
 */
type ResponseBody =
	| { data: unknown; meta: unknown } // both required
	| { data: unknown; meta?: never } // only data, meta explicitly excluded
	| { data?: never; meta: unknown }; // only meta, data explicitly excluded

/**
 * Generic type for configuring async handler request and response types.
 */
export type AsyncHandlerGenerics = {
	locals?: Response["locals"];
	params?: Request["params"];
	query?: Request["query"];
	reqBody?: Request["body"];
	resBody: ResponseBody;
};

/**
 * Type-safe version of `res.json()` that enforces proper API response shape
 */
type StrictResponseJson<Body extends ResponseBody> =
	StrictSuccessResponse<Body> extends never
		? never
		: (body: StrictApiResponse<Body>) => Response;

/**
 * Strict version of Express Response type.
 * Replaces `.json` to only allow valid API responses.
 */
type StrictResponse<
	Body extends ResponseBody,
	Locals extends Record<string, unknown> | undefined = Record<string, unknown>,
> = Omit<Response, "json" | "status"> & {
	json: StrictResponseJson<Body>;
	locals: NonNullable<Locals>;
	status: (code: number) => StrictResponse<Body, Locals>;
};

/**
 * Express async request handler type.
 * Enforces proper request/response typing and async error handling
 */
export type StrictAsyncHandler<
	G extends AsyncHandlerGenerics = AsyncHandlerGenerics,
> = (
	req: Request<
		NonNullable<G["params"]>,
		unknown,
		G["reqBody"],
		NonNullable<G["query"]>
	>,
	res: StrictResponse<G["resBody"], G["locals"]>,
	next: NextFunction,
) => Promise<void>;
