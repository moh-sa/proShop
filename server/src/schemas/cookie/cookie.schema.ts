import z from "zod";

import { SESSION_COOKIE_NAME } from "../../constants/index.js";

export const cookieNameSchema = z.enum([SESSION_COOKIE_NAME]);
