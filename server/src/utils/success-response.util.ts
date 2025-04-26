import { Response } from "express";

type ObjectType = Record<string, unknown>;

interface SuccessResponse<D = ObjectType, M = ObjectType> {
  success?: boolean;
  data: D;
  meta?: M;
}

export function sendSuccessResponse<D, M>({
  res,
  success = true,
  statusCode,
  data,
  meta,
}: { res: Response; statusCode: number } & SuccessResponse<D, M>): void {
  const response: SuccessResponse<D, M> = {
    success,
    data,
    meta,
  };
  res.status(statusCode).json(response);
}
