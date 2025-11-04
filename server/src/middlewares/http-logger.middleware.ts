import type { Response } from "express";

import { pinoHttp } from "pino-http";

import { env } from "../config/env.js";
import { logger } from "../utils/logger.util.js";

export const httpLogger = pinoHttp({
	logger,

	// Custom log level based on status code and error
	customLogLevel: (_req, res, err) => {
		// Client errors
		if (res.statusCode >= 400 && res.statusCode < 500) {
			return "warn";
		}

		// Server errors
		else if (res.statusCode >= 500 || err) {
			return "error";
		}

		// Success
		return "info";
	},

	// Additional properties attached to each log
	customProps: (req, res: Response) => ({
		requestId: req.id,
		userId: res.locals.userId,
	}),

	// Success message
	customSuccessMessage: (req, res) => {
		return `Request completed: ${req.method} ${req.url} ${res.statusCode}`;
	},

	// Error message
	customErrorMessage: (req, res, _err) => {
		return `Request failed: ${req.method} ${req.url} ${res.statusCode}`;
	},

	// Alias for error, request, response, responseTime
	customAttributeKeys: {
		err: "error",
		req: "request",
		res: "response",
		responseTime: "duration",
	},

	// cherry pick the fields to log
	serializers: {
		req: (req) => ({
			method: req.method,
			url: req.url,
			// Only log body, params, query in development mode
			...(env.NODE_ENV === "development" && {
				body: req.raw.body,
				params: req.params,
				query: req.query,
			}),
		}),
		res: (res) => ({
			statusCode: res.statusCode,
		}),
	},
});
