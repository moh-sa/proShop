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

export function sendErrorResponse({
  res,
  statusCode,
  errors,
  code,
}: { res: Response; statusCode: number } & Omit<
  ErrorResponse,
  "success" | "timestamp"
>): void {
  const response: ErrorResponse = {
    success: false,
    code,
    timestamp: new Date().toISOString(),
    errors,
  };

  res.status(statusCode).json(response);
}
