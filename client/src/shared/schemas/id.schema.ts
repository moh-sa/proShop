import z from "zod";

export const idSchema = z.string().trim().length(24, { error: "Invalid id." });
