import { NextFunction, Request, Response } from "express";
import { createMocks } from "node-mocks-http";

export const createMockExpressContext = () => {
  const { req, res } = createMocks<Request, Response>();

  const next: NextFunction = (error) => {
    if (error) throw error;
  };

  return { req, res, next };
};
