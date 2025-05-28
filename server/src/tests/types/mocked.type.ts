import { Mock } from "node:test";

type FunctionMocks<T> = {
  [P in keyof T]: T[P] extends (...args: infer A) => infer R
    ? Mock<(...args: A) => R>
    : T[P];
};

export type FunctionMocksWithReset<T> = FunctionMocks<T> & {
  reset: () => void;
};
