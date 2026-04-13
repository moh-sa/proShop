import * as Sentry from "@sentry/node";
import type { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { ZodError } from "zod";

import { env } from "../config/index.js";
import { ERROR_TYPE, HTTP_STATUS } from "../constants/index.js";
import { BaseError, JwtBaseError } from "../errors/index.js";
import { sendErrorResponse } from "../utils/index.js";

export function errorHandler(
	error: Error,
	req: Request,
	res: Response,
	_next: NextFunction,
) {
	if (shouldReportToSentry(error)) {
		// Sent error to Sentry
		Sentry.captureException(error, {
			extra: {
				requestId: req.id,
			},
			level: "error",
			user: {
				id: res.locals.userId,
				ip_address: req.ip,
			},
		});
	}

	// Handle Zod validation errors
	if (error instanceof ZodError) {
		error.format();
		return sendErrorResponse({
			code: ERROR_TYPE.VALIDATION,
			errors: error.issues.map((issue) => ({
				message: issue.message,
				path: issue.path.join("."),
			})),
			responseContext: res,
			statusCode: HTTP_STATUS.BAD_REQUEST,
		});
	}

	// Handle JWT errors
	if (error instanceof JwtBaseError) {
		return sendErrorResponse({
			code: error.type,
			errors: [
				{
					message: error.message,
					path: req.path,
				},
			],
			responseContext: res,
			statusCode: error.statusCode,
		});
	}

	if (error instanceof MulterError) {
		return sendErrorResponse({
			code: ERROR_TYPE.BAD_REQUEST, // FIXME: add a better error type
			errors: [
				{
					message: error.message || "File upload failed",
					path: req.path,
				},
			],
			responseContext: res,
			statusCode: HTTP_STATUS.BAD_REQUEST,
		});
	}

	// fallback handler for custom errors instances
	if (error instanceof BaseError) {
		return sendErrorResponse({
			code: error.type,
			errors: [
				{
					message: error.message,
					path: req.path,
				},
			],
			responseContext: res,
			statusCode: error.statusCode,
		});
	}

	return sendErrorResponse({
		code: ERROR_TYPE.INTERNAL,
		errors: [
			{
				message: error.message || "Internal server error",
				path: req.path,
				...(env.NODE_ENV === "development" && { stack: error.stack }),
			},
		],
		responseContext: res,
		statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
	});
}

function shouldReportToSentry(error: Error): boolean {
	if (error instanceof ZodError) {
		return false;
	}
	if (error instanceof MulterError) {
		return false;
	}
	if (error instanceof BaseError) {
		return error.statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR;
	}
	return true;
}
