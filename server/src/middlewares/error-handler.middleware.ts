import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { MulterError } from "multer";
import { env } from "process";
import { ZodError } from "zod";
import { BaseError } from "../errors";
import { ErrorResponse, ErrorType } from "../types";

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Handle different types of errors
  if (error instanceof BaseError) {
    const response: ErrorResponse = {
      message: error.message,
      code: error.type,
      timestamp: new Date().toISOString(),
      path: req.path,
      details: error.details,
    };
    return res.status(error.statusCode).json(response);
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const response: ErrorResponse = {
      message: "Validation failed",
      code: ErrorType.VALIDATION,
      timestamp: new Date().toISOString(),
      path: req.path,
      details: {
        errors: error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        })),
      },
    };
    return res.status(400).json(response);
  }

  // Handle JWT errors
  if (
    error instanceof JsonWebTokenError ||
    error instanceof TokenExpiredError
  ) {
    const response: ErrorResponse = {
      message: "Invalid or expired token",
      code: ErrorType.AUTHENTICATION,
      timestamp: new Date().toISOString(),
      path: req.path,
    };
    return res.status(401).json(response);
  }

  if (error instanceof MulterError) {
    const response: ErrorResponse = {
      message: error.message || "File upload failed",
      code: error.code,
      timestamp: new Date().toISOString(),
      path: req.path,
    };

    return res.status(400).json(response);
  }

  // Handle unknown errors
  const response: ErrorResponse = {
    message: "An unexpected error occurred",
    code: ErrorType.INTERNAL,
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // In development, include the error stack
  if (env.NODE_ENV === "development") {
    response.details = {
      stack: error.stack,
    };
  }

  return res.status(500).json(response);
}
