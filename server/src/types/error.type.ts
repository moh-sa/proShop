export enum ErrorType {
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  INTERNAL = "INTERNAL",
  BAD_REQUEST = "BAD_REQUEST",
  RATE_LIMIT = "RATE_LIMIT",
  DATABASE_ERROR = "DATABASE_ERROR",

  CACHE_ERROR = "CACHE_ERROR",
  CACHE_CONNECTION_ERROR = "CACHE_CONNECTION_ERROR",
  CACHE_CAPACITY_ERROR = "CACHE_CAPACITY_ERROR",

  EMPTY_CART = "EMPTY_CART",
}

export interface ErrorResponse {
  message: string;
  code: string;
  timestamp: string;
  path: string;
  details?: Record<string, unknown>;
}
