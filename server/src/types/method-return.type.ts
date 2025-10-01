/**
 * Gets the return type of a method from an interface.
 *
 * Note: Does *not* work with methods that use generics.
 *
 * @example
 * interface Foo { bar(x: number): string }
 * type BarReturn = MethodReturn<Foo, "bar">; // string
 */
export type MethodReturn<
	Interface extends object,
	Method extends keyof Interface,
> = Interface[Method] extends (...args: infer _) => infer Return
	? Return
	: never;
