// credit: https://www.totaltypescript.com/tips/use-deep-partials-to-help-with-mocking-an-entity

export type DeepPartialObject<Thing> = {
	[Key in keyof Thing]?: DeepPartial<Thing[Key]>;
};

type DeepPartialArray<Thing> = Array<DeepPartial<Thing>>;

type DeepPartial<Thing> = Thing extends (...args: Array<unknown>) => unknown
	? Thing
	: Thing extends Array<infer InferredArrayMember>
		? DeepPartialArray<InferredArrayMember>
		: Thing extends object
			? DeepPartialObject<Thing>
			: Thing | undefined;
