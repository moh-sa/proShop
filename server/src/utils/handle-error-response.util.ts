import { Response } from "express";

export function handleErrorResponse(
  res: Response,
  statusCode: number,
  errorMessage: string,
) {
  res.status(statusCode);
  throw new Error(errorMessage);
}
