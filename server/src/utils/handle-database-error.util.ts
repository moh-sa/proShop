import mongoose, { Error as MongooseError } from "mongoose";
import {
  DatabaseDuplicateKeyError,
  DatabaseNetworkError,
  DatabaseQueryError,
  DatabaseTimeoutError,
  DatabaseValidationError,
  GenericDatabaseError,
} from "../errors";

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
