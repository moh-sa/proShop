import type { Types } from "mongoose";

import mongoose from "mongoose";

type NonPlainObject =
	| ((...args: Array<unknown>) => unknown)
	| (abstract new (...args: Array<unknown>) => unknown)
	| ArrayBuffer
	| ArrayBufferView
	| Promise<unknown>
	| ReadonlyMap<unknown, unknown>
	| ReadonlySet<unknown>
	| RegExp;

type Prettify<T> = { [K in keyof T]: T[K] } & {};

type SerializedMongoPlainObject<T extends object> = Prettify<
	WithSerializedId<T, SerializedObjectFields<T>>
>;

type SerializedObjectFields<T extends object> = {
	[K in keyof T as K extends "__v" | "_id" ? never : K]: SerializedMongoResult<
		T[K]
	>;
};

type WithSerializedId<
	TSource extends object,
	TResult extends object,
> = "_id" extends keyof TSource
	? Omit<TResult, "id"> & { id: string }
	: TResult;

/**
 * Deep result shape for the serializeMongoResult function:
 *
 * - Top-level or nested `mongoose.Types.ObjectId` → `string`
 * - Plain objects: `__v` removed; `_id` becomes `id: string`; other keys recurse
 * - Arrays: elements transformed (tuple structure preserved)
 * - `Date`, `Map`, `RegExp` and values that are not plain objects at runtime are unchanged
 */
type SerializedMongoResult<T> = T extends Types.ObjectId
	? string
	: T extends Date
		? Date
		: T extends ReadonlyArray<unknown>
			? { [K in keyof T]: SerializedMongoResult<T[K]> }
			: T extends NonPlainObject
				? T
				: T extends object
					? SerializedMongoPlainObject<T>
					: T;

/**
 * Converts MongoDB documents to plain JavaScript objects for API output,
 * replacing `_id` with `id`, removing `__v`, and serializing ObjectIds to strings.
 */
export function serializeMongoResult<T>(input: T): SerializedMongoResult<T> {
	const seen = new WeakMap<object, object>();

	const visit = (value: unknown): unknown => {
		if (value == null) {
			return value;
		}
		if (value instanceof mongoose.Types.ObjectId) {
			return value.toString();
		}
		if (value instanceof Date) {
			return value;
		}

		if (Array.isArray(value)) {
			return value.map(visit);
		}
		if (!isPlainObject(value)) {
			return value;
		}
		if (seen.has(value)) {
			return seen.get(value);
		}

		const src = value as Record<string, unknown>;
		const out: Record<string, unknown> = {};
		seen.set(value, out);

		for (const [key, raw] of Object.entries(src)) {
			if (key === "__v") {
				continue;
			}

			if (key === "_id") {
				if (raw instanceof mongoose.Types.ObjectId) {
					out.id = raw.toString();
				}
				if (typeof raw === "string") {
					out.id = raw;
				}

				continue;
			}

			out[key] = visit(raw);
		}

		return out;
	};

	return visit(input) as SerializedMongoResult<T>;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return Object.prototype.toString.call(value) === "[object Object]";
}
