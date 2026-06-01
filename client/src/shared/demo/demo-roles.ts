import { z } from "zod";

export const demoRoleSchema = z.object({
	role: z.enum(["admin", "customer"]),
});

export type DemoRole = z.infer<typeof demoRoleSchema>;
