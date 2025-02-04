export type Namespace = "product" | "user" | "order" | "rate-limit";

export interface CacheConfig {
  stdTTL: number;
  checkperiod: number;
  useClones: boolean;
  deleteOnExpire: boolean;
}
