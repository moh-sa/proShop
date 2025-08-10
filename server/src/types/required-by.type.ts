export type RequiredBy<T, K extends keyof T> = Partial<T> & Pick<T, K>;
