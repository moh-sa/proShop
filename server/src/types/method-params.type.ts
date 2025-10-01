/**
 * Extracts the first parameter type of a method from an interface.
 *
 * Note: Does *not* work with methods that use generics.
 *
 * @example
 * interface Example {
 *   foo(bar: string, baz: number): void;
 * }
 *
 * type FooParams = MethodParams<Example, "foo">; // string
 */
export type MethodParams<
	Interface extends object,
	Method extends keyof Interface,
> = Interface[Method] extends (...args: infer Args) => unknown
	? Args[0]
	: never;
