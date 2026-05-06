import type z from "zod";
import type { paginationParamsSchema } from "../schemas";

export type PaginationParams = z.infer<typeof paginationParamsSchema>;
