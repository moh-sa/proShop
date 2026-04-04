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
 * Handles database errors and returns the appropriate error.
 */
export function handleDatabaseErrorResult(
	error: unknown,
): FailureResult<DatabaseBaseError> {
	if (error instanceof mongoose.mongo.MongoNetworkTimeoutError) {
		return {
			error: new DatabaseTimeoutError(error.message, { cause: error }),
			success: false,
		};
	}

	if (
		error instanceof mongoose.Error.ValidationError ||
		error instanceof mongoose.Error.CastError ||
		error instanceof mongoose.mongo.BSON.BSONError
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
