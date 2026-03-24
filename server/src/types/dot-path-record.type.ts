/**
 * Returns `true` if T is a plain record object
 *
 * Uses tuple wrapping `[T]` to prevent distributive evaluation over union types.
 */
type IsRecord<T> = [T] extends [Record<string, unknown>] ? true : false;

/**
 * Converts a union type into an intersection type.
 *
 * e.g. `{ a: string } | { b: number }` → `{ a: string } & { b: number }`
 */
// MergeUnion
type MergeUnion<U> = (U extends unknown ? (x: U) => void : never) extends (
	x: infer I,
) => void
	? I
	: never;

/** Produces dot-path keys for each key in a plain object value V under parent key K */
// FlatObjectEntry
type FlatObjectEntry<K extends string, V> = {
	[NestedKey in keyof V as `${K}.${NestedKey & string}`]: V[NestedKey];
};

/** Flattens an array value V under parent key K, if array elements are plain objects */
// FlatArrayEntry
type FlatArrayEntry<K extends string, V extends Array<unknown>> =
	V extends Array<infer Elem>
		? IsRecord<Elem> extends true
			? FlatObjectEntry<K, Elem>
			: never
		: never;

/**
 * For a given key K of T, produces either:
 * - A flat object with dot-path keys (if the value is a plain object or object array)
 * - Pick<T, K> (the key as-is) if the value is NonRecordValue
 */
// FlatEntry
type FlatEntry<T extends object, K extends keyof T & string> =
	NonNullable<T[K]> extends infer V
		? V extends Array<unknown>
			? FlatArrayEntry<K, V> extends never
				? Pick<T, K>
				: FlatArrayEntry<K, V>
			: IsRecord<V> extends true
				? FlatObjectEntry<K, V>
				: Pick<T, K>
		: never;

/**
 * Flattens a one-level-deep object type T into a single object
 * where nested keys are expressed as dot-separated paths.
 *
 * @example
 * type User = { name: string; address: { city: string } };
 * type Flat = FlattenObjectKeys<User>;
 * // → { name: string; "address.city": string }
 */
export type DotPathRecord<T extends Record<string, unknown>> = MergeUnion<
	{ [K in keyof T & string]: FlatEntry<T, K> }[keyof T & string]
>;
