import type { Response } from "express";

type ObjectType = Record<string, unknown>;

interface SuccessResponse<D = ObjectType, M = ObjectType> {
  data: D;
  meta?: M;
  success?: boolean;
}

export function createSuccessResponseObject<D, M>({
  data,
  meta,
}: {
  data: D;
  meta?: M;
}): SuccessResponse<D, M> {
  return {
    data,
    meta,
    success: true,
  };
}

export function sendSuccessResponse<D, M>({
  data,
  meta,
  responseContext,
  statusCode,
}: SuccessResponse<
  D,
  M
> & { responseContext: Response; statusCode: number }): void {
  const response = createSuccessResponseObject({ data, meta });
  responseContext.status(statusCode).json(response);
}
