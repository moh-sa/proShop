import type z from "zod";
import type {
	createApiResponseSchema,
	createPaginatedResponseSchema,
	errorDetailsSchema,
	errorResponseSchema,
	paginationMetaSchema,
} from "../schemas";

export type ApiResponse<TData> = z.infer<
	ReturnType<typeof createApiResponseSchema<TData>>
>;

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

export type ApiPaginatedResponse<TData> = z.infer<
	ReturnType<typeof createPaginatedResponseSchema<TData>>
>;

export type ApiErrorDetail = z.infer<typeof errorDetailsSchema>;

export type ApiError = z.infer<typeof errorResponseSchema>;
