import type { NextFunction, Request, Response } from "express";
import { createMocks } from "node-mocks-http";

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
 */
export function createMockExpressContext() {
	return baseMockContext<Request, Response>();
}
