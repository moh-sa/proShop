import { Request, Response } from "express";
import { TestContext } from "node:test";
import { DeepPartialObject } from "../../types";

function mockRequest(data: Partial<Request>): Partial<Request> {
  return data;
}

function mockResponse({
  testContext,
  locals = {},
}: {
  testContext: TestContext;
  locals?: DeepPartialObject<Response["locals"]>;
}) {
  const res = {
    json: testContext.mock.fn((input: unknown) => input),
    status: testContext.mock.fn((code: number) => res),
    locals,
  };

  return res;
}

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
    req: mockRequest(req),
    res: mockResponse({ testContext: testContext, locals: res.locals }),
    next: testContext.mock.fn((err) => {
      if (err) throw err;
    }),
  };
}
