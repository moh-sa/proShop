import type { Response } from "express";

import type { ErrorType } from "../types/index.js";

interface ErrorDetails {
  [key: string]: unknown;
  message: string;
  path?: string;
}

interface ErrorResponse {
  code: ErrorType;
  errors: Array<ErrorDetails>;
  success: false;
  timestamp: string;
}

export function createErrorResponseObject({
  code,
  errors,
}: Omit<ErrorResponse, "success" | "timestamp">): ErrorResponse {
  return {
    code,
    errors,
    success: false,
    timestamp: new Date().toISOString(),
  };
}

export function sendErrorResponse({
  code,
  errors,
  responseContext,
  statusCode,
}: Omit<ErrorResponse, "success" | "timestamp"> & {
  responseContext: Response;
  statusCode: number;
}): void {
  const response = createErrorResponseObject({ code, errors });
  responseContext.status(statusCode).json(response);
}
