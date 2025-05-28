import { Response } from "express";

type ObjectType = Record<string, unknown>;

interface SuccessResponse<D = ObjectType, M = ObjectType> {
  success?: boolean;
  data: D;
  meta?: M;
}

export function createSuccessResponseObject<D, M>({
  data,
  meta,
}: {
  data: D;
  meta?: M;
}): SuccessResponse<D, M> {
  return {
    success: true,
    data,
    meta,
  };
}

export function sendSuccessResponse<D, M>({
  res,
  statusCode,
  data,
  meta,
}: { res: Response; statusCode: number } & SuccessResponse<D, M>): void {
  const response = createSuccessResponseObject({ data, meta });
  res.status(statusCode).json(response);
}
