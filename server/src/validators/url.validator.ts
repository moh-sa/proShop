import z from "zod";

export const urlValidator = z.string().trim().pipe(z.url());
