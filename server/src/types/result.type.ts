export type SuccessResult<T> = { success: true; data: T };
export type FailureResult<E = Error> = { success: false; error: E };
export type Result<T, E = Error> = SuccessResult<T> | FailureResult<E>;
