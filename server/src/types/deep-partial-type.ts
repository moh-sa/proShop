// credit: https://www.totaltypescript.com/tips/use-deep-partials-to-help-with-mocking-an-entity
type DeepPartial<Thing> = Thing extends Function
  ? Thing
  : Thing extends Array<infer InferredArrayMember>
  ? DeepPartialArray<InferredArrayMember>
  : Thing extends object
  ? DeepPartialObject<Thing>
  : Thing | undefined;

export interface DeepPartialArray<Thing> extends Array<DeepPartial<Thing>> {}

export type DeepPartialObject<Thing> = {
  [Key in keyof Thing]?: DeepPartial<Thing[Key]>;
};
