import type { NextFunction, Request, Response } from "express";

import * as Sentry from "@sentry/node";
import { MulterError } from "multer";
import { ZodError } from "zod";

import { env } from "../config/index.js";
import { ErrorType } from "../constants/index.js";
import { BaseError, JwtBaseError } from "../errors/index.js";
import { sendErrorResponse } from "../utils/index.js";

export function errorHandler(
	error: Error,
	req: Request,
	res: Response,
	_next: NextFunction,
) {
	// Sent error to Sentry
	Sentry.captureException(error, {
		level: "error",
		user: {
			id: res.locals.userId,
			ip_address: req.ip,
		},
	});

	// Handle different types of errors
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

	// Handle Zod validation errors
	if (error instanceof ZodError) {
		error.format();
		return sendErrorResponse({
			code: ErrorType.VALIDATION,
			errors: error.issues.map((issue) => ({
				message: issue.message,
				path: issue.path.join("."),
			})),
			responseContext: res,
			statusCode: 400,
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
			code: ErrorType.BAD_REQUEST, // FIXME: add a better error type
			errors: [
				{
					message: error.message || "File upload failed",
					path: req.path,
				},
			],
			responseContext: res,
			statusCode: 400,
		});
	}

	return sendErrorResponse({
		code: ErrorType.INTERNAL,
		errors: [
			{
				message: error.message || "Internal server error",
				path: req.path,
				...(env.NODE_ENV === "development" && { stack: error.stack }),
			},
		],
		responseContext: res,
		statusCode: 500,
	});
}
