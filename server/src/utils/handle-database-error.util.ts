import mongoose, { Error as MongooseError } from "mongoose";

import type { DatabaseBaseError } from "../errors/index.js";
import type { FailureResult } from "../types/index.js";

import {
	DatabaseDuplicateKeyError,
	DatabaseNetworkError,
	DatabaseQueryError,
	DatabaseTimeoutError,
	DatabaseValidationError,
	GenericDatabaseError,
} from "../errors/index.js";

/**
 * Handles database errors and throws the appropriate error.
 * @param error - The error to handle.
 * @returns Never.
 */
export function handleDatabaseError(error: unknown): never {
	console.error("Database error:", error);

	if (error instanceof mongoose.mongo.MongoNetworkTimeoutError) {
		throw new DatabaseTimeoutError(error.message, { originalError: error });
	}

	if (
		error instanceof mongoose.Error.ValidationError ||
		error instanceof mongoose.Error.CastError
	) {
		throw new DatabaseValidationError(error.message, { originalError: error });
	}

	if (
		error instanceof mongoose.mongo.MongoServerError &&
		error.code === 11000
	) {
		throw new DatabaseDuplicateKeyError(error.message, {
			originalError: error,
		});
	}

	if (error instanceof MongooseError) {
		throw new DatabaseQueryError(error.message, { originalError: error });
	}

	if (error instanceof mongoose.mongo.MongoError) {
		throw new DatabaseNetworkError(error.message, { originalError: error });
	}

	throw new GenericDatabaseError("Unexpected database error", {
		originalError: error,
	});
}

/**
 * Handles database errors and returns the appropriate error.
 */
export function handleDatabaseErrorResult(
	error: unknown,
): FailureResult<DatabaseBaseError> {
	console.error("Database error:", error);

	if (error instanceof mongoose.mongo.MongoNetworkTimeoutError) {
		return {
			error: new DatabaseTimeoutError(error.message, { cause: error }),
			success: false,
		};
	}

	if (
		error instanceof mongoose.Error.ValidationError ||
		error instanceof mongoose.Error.CastError
	) {
		return {
			error: new DatabaseValidationError(error.message, { cause: error }),
			success: false,
		};
	}

	if (
		error instanceof mongoose.mongo.MongoServerError &&
		error.code === 11000
	) {
		return {
			error: new DatabaseDuplicateKeyError(error.message, {
				cause: error,
			}),
			success: false,
		};
	}

	if (error instanceof MongooseError) {
		return {
			error: new DatabaseQueryError(error.message, { cause: error }),
			success: false,
		};
	}

	if (error instanceof mongoose.mongo.MongoError) {
		return {
			error: new DatabaseNetworkError(error.message, { cause: error }),
			success: false,
		};
	}

	if (error instanceof Error) {
		return {
			error: new GenericDatabaseError(`Database operation failed: ${error}`, {
				cause: error,
			}),
			success: false,
		};
	}

	return {
		error: new GenericDatabaseError("Unexpected database error", {
			cause: error,
		}),
		success: false,
	};
}
