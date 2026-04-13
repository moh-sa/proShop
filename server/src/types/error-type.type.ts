import type { ERROR_TYPE } from "../constants/index.js";

export type ErrorType = (typeof ERROR_TYPE)[keyof typeof ERROR_TYPE];
