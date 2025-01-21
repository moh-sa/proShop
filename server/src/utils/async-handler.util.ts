import { NextFunction, Request, Response } from "express";

/**
 *
 * - A wrapper function for async functions that `catch` errors and pass them to the error handler middleware.
 * - Designed for `middlewares` and `controllers` async methods.
 * @example
 * ```ts
 * asyncHandler(async (req, res, next) => {
 *   // do something
 * })
 * ```
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return function (req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next);
  };
}
