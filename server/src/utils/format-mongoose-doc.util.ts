import type { ToObjectOptions } from "mongoose";

import { Types } from "mongoose";

/**
 * Convert a Mongoose document type to a friendlier shape.
 *
 * - Rename `_id` key to `id`
 * - Convert `ObjectId` to `string`
 * - Remove `__v` key
 */
type MongooseDocJSON<T> = T extends Types.ObjectId
	? string // ObjectId becomes string
	: T extends Date
		? Date // Date remains Date
		: T extends ReadonlyArray<infer U>
			? Array<MongooseDocJSON<U>> // handle arrays recursively
			: T extends object
				? {
						[K in keyof T as K extends "__v"
							? never // remove __v
							: K extends "_id"
								? "id" // rename _id key to id
								: K]: K extends "_id"
							? string // id becomes string
							: MongooseDocJSON<T[K]>; // handle nested objects recursively
					}
				: T; // other types remain the same

/**
 * Convert a Mongoose document value to a friendlier shape.
 * - Rename `_id` key to `id`
 * - Convert `ObjectId` to `string`
 * - Remove `__v` key
 *
 * @example
 * const dto = formatMongooseDoc(userDoc); // {id: string, ...}
 */
export function formatMongooseDoc<T>(input: T): MongooseDocJSON<T> {
	return formatMongooseValue(input);
}

/**
 * Recursively formats a Mongoose document into a friendlier shape.
 *
 * This complements the `MongooseDocJSON<T>` type so runtime output matches the static type.
 */
function formatMongooseValue(value: Types.ObjectId): string;
function formatMongooseValue(value: Date): Date;
function formatMongooseValue<T>(
	value: ReadonlyArray<T>,
): MongooseDocJSON<Array<T>>;
function formatMongooseValue<T>(value: T): MongooseDocJSON<T>;
function formatMongooseValue(value: unknown): unknown {
	// Handle null and undefined
	if (value === null || value === undefined) {
		return value;
	}

	// Convert ObjectId to string
	if (value instanceof Types.ObjectId) {
		return value.toString();
	}

	// Handle dates
	if (value instanceof Date) {
		return value;
	}

	// Handle arrays
	if (Array.isArray(value)) {
		return value.map((item) => formatMongooseValue(item));
	}

	// Handle objects
	if (typeof value === "object") {
		const base = mongooseToObject(value);
		const result: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(base)) {
			// remove _id and __v if exist
			if (key === "_id" || key === "__v") {
				continue;
			}
			// Avoid overriding id if already exist
			if (key === "id" && "id" in result) {
				continue;
			}
			result[key] = formatMongooseValue(val);
		}
		return result;
	}

	return value;
}

/**
 * Converts a Mongoose document-like value to a plain JavaScript object.
 *
 * - If `toObject`/`toJSON` exists, call it with safe defaults.
 * - Otherwise return the original value
 */
function mongooseToObject(value: object): object {
	const options: ToObjectOptions = {
		flattenMaps: true,
		getters: true,
		versionKey: false,
		virtuals: true,
	};
	if ("toObject" in value && typeof value.toObject === "function") {
		return value.toObject(options);
	}

	if ("toJSON" in value && typeof value.toJSON === "function") {
		return value.toJSON(options);
	}

	return value;
}
