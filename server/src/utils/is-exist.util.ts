type NullishValues = 0 | "" | false | null | undefined;
export function isExist<T>(data: NullishValues | T): data is T {
  return Boolean(data) && !Number.isNaN(data);
}
