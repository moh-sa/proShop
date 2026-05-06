import z from "zod";

export const paginationParamsSchema = z.object({
	pageNumber: z.number().int().positive(),
	pageSize: z.number().int().positive(),
});
