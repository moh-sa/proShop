import type { HTTP_STATUS } from "../constants/http-status.constants.js";

export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
