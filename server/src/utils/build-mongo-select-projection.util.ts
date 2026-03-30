type ProjectionInput = Record<string, true | undefined>;

type ProjectionOutput<TInput extends ProjectionInput> = Partial<{
	[TKey in keyof TInput as Extract<TInput[TKey], true> extends never
		? never
		: TKey]: TKey extends string ? ProjectionValue<TKey> : never;
}>;

type ProjectionValue<TKey extends string> = TKey extends `${string}.${string}`
	? `$${TKey}`
	: 1;

/**
 * Builds a MongoDB projection object from input object.
 *
 * @example
 * buildMongoSelectProjection({_id: true,"user.email": true});
 * // { _id: 1, "user.email": "$user.email" }
 */
export function buildMongoSelectProjection<TInput extends ProjectionInput>(
	input?: TInput,
): ProjectionOutput<TInput> {
	if (!input) {
		return {};
	}

	const entries = Object.entries(input)
		.filter(([_, value]) => value === true)
		.map(([key]) => {
			const mappedValue = key.includes(".") ? `$${key}` : 1;
			return [key, mappedValue];
		});

	return Object.fromEntries(entries) as ProjectionOutput<TInput>;
}
