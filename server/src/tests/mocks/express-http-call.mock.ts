import type { Request, Response } from "express";
import type { TestContext } from "node:test";

import type { DeepPartialObject } from "../../types/index.js";

export function mockExpressCall({
  req = {},
  res = { locals: {} },
  testContext,
}: {
  req?: Partial<Request>;
  res?: { locals: DeepPartialObject<Response["locals"]> };
  testContext: TestContext;
}) {
  return {
    next: testContext.mock.fn((err) => {
      if (err) throw err;
    }),
    req: mockRequest(req),
    res: mockResponse({ locals: res.locals, testContext }),
  };
}

function mockRequest(data: Partial<Request>): Partial<Request> {
  return data;
}

function mockResponse({
  locals = {},
  testContext,
}: {
  locals?: DeepPartialObject<Response["locals"]>;
  testContext: TestContext;
}) {
  const res = {
    json: testContext.mock.fn((input: unknown) => input),
    locals,
    status: testContext.mock.fn((_code: number) => res),
  };

  return res;
}
