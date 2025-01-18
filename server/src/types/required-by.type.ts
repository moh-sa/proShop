export type RequiredBy<T, K extends keyof T> = Pick<T, K> & Partial<T>;
