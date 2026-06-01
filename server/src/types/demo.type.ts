import type z from "zod";

import type { DEMO_ACCOUNT_EMAILS } from "../constants/demo-account.constants.js";
import type { demoRoleSchema } from "../schemas/demo/demo-role.schema.js";

export type DemoAccountRole = keyof typeof DEMO_ACCOUNT_EMAILS;
export type DemoRole = z.infer<typeof demoRoleSchema>;
