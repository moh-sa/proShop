import { z } from "zod";

export const tokenTypeSchema = z.enum(["access", "refresh"]);
