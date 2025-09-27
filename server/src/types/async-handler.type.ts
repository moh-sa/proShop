import type { NextFunction, Request, Response } from "express";

import type { ApiResponse, successResponse } from "./api-response.type.js";

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
	successResponse<Body> extends never
		? never
		: (body: ApiResponse<Body>) => Response;

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
export type AsyncHandler<
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
