export type Stringify<T extends Record<string, unknown>> = {
	[K in keyof T]: T[K] extends infer V
		? V extends Record<string, unknown>
			? { [P in keyof V]: string }
			: string
		: never;
};
