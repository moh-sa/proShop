export type FailureResult<E = Error> = { error: E; success: false; };
export type Result<T, E = Error> = FailureResult<E> | SuccessResult<T>;
export type SuccessResult<T> = { data: T; success: true; };
