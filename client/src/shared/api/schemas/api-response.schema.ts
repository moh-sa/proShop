import z from "zod";

// SUCCESS
export function createApiResponseSchema<TData>(dataSchema: z.ZodType<TData>) {
	return z.object({
		data: dataSchema,
	});
}

// PAGINATION
export const paginationMetaSchema = z.object({
	currentPage: z.number().int().positive(),
	hasNextPage: z.boolean(),
	hasPreviousPage: z.boolean(),
	pageSize: z.number().int().positive(),
	totalItems: z.number().int().nonnegative(),
	totalPages: z.number().int().nonnegative(),
});

export function createPaginatedResponseSchema<T>(itemsSchema: z.ZodType<T>) {
	return z.object({
		data: z.array(itemsSchema),
		meta: paginationMetaSchema,
	});
}

// ERROR
export const errorDetailsSchema = z.looseObject({
	message: z.string(),
	path: z.string().optional(),
});

export const errorResponseSchema = z.object({
	code: z.string().trim().nonempty(),
	errors: z.array(errorDetailsSchema),
	success: z.literal(false),
	timestamp: z.string(),
});
