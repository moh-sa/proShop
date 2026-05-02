import type z from "zod";
import type { paginationParamsSchema } from "../schemas/pagination.schema";

export type PaginationParams = z.infer<typeof paginationParamsSchema>;
