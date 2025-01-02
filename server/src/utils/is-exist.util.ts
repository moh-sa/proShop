type NullishValues = null | undefined | false | 0 | "";
export function isExist<T>(data: T | NullishValues): data is T {
  return Boolean(data) && !Number.isNaN(data);
}
