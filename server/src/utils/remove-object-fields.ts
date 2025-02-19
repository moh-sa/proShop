type FieldsWithoutRemovedFields<T, K extends keyof T> = {
  [P in Exclude<keyof T, K>]: T[P];
};

export function removeObjectFields<T extends Object, K extends keyof T>(
  data: T,
  fieldsToRemove: K[],
): FieldsWithoutRemovedFields<T, K> {
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => !fieldsToRemove.includes(key as K)),
  ) as FieldsWithoutRemovedFields<T, K>;
}
