import type { Mock } from "node:test";

export type FunctionMocksWithReset<T> = FunctionMocks<T> & {
	reset: () => void;
};

type FunctionMocks<T> = {
	[P in keyof T]: T[P] extends (...args: infer A) => infer R
		? Mock<(...args: A) => R>
		: T[P];
};
