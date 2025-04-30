import { Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { env } from "../config";
import { BaseError } from "../errors";
import { ErrorType } from "../types";
import { sendErrorResponse } from "../utils";

export function errorHandler(error: Error, req: Request, res: Response) {
  // Handle different types of errors
  if (error instanceof BaseError) {
    return sendErrorResponse({
      res,
      code: error.type,
      statusCode: error.statusCode,
      errors: [
        {
          path: req.path,
          message: error.message,
        },
      ],
    });
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    error.format();
    return sendErrorResponse({
      res,
      code: ErrorType.VALIDATION,
      statusCode: 400,
      errors: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  // Handle JWT errors
  if (
    error instanceof JsonWebTokenError ||
    error instanceof TokenExpiredError
  ) {
    return sendErrorResponse({
      res,
      code: ErrorType.AUTHENTICATION,
      statusCode: 401,
      errors: [
        {
          path: req.path,
          message: error.message,
        },
      ],
    });
  }

  if (error instanceof MulterError) {
    return sendErrorResponse({
      res,
      code: ErrorType.BAD_REQUEST, // FIXME: add a better error type
      statusCode: 400,
      errors: [
        {
          path: req.path,
          message: error.message || "File upload failed",
        },
      ],
    });
  }

  return sendErrorResponse({
    res,
    code: ErrorType.INTERNAL,
    statusCode: 500,
    errors: [
      {
        path: req.path,
        message: error.message || "Internal server error",
        ...(env.NODE_ENV === "development" && { stack: error.stack }),
      },
    ],
  });
}
