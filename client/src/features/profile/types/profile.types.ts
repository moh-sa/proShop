import type { z } from "zod";
import type { updateProfileSchema } from "../schemas";

export type UpdateProfile = z.infer<typeof updateProfileSchema>;
