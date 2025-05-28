import { Response } from "express";
import { ErrorType } from "../types";

interface ErrorDetails {
  path?: string;
  message: string;
  [key: string]: unknown;
}

interface ErrorResponse {
  success: false;
  timestamp: string;
  code: ErrorType;
  errors: Array<ErrorDetails>;
}

export function createErrorResponseObject({
  errors,
  code,
}: Omit<ErrorResponse, "success" | "timestamp">): ErrorResponse {
  return {
    success: false,
    code,
    timestamp: new Date().toISOString(),
    errors,
  };
}

export function sendErrorResponse({
  res,
  statusCode,
  errors,
  code,
}: { res: Response; statusCode: number } & Omit<
  ErrorResponse,
  "success" | "timestamp"
>): void {
  const response = createErrorResponseObject({ errors, code });

  res.status(statusCode).json(response);
}
