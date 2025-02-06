import { Types } from "mongoose";

export function generateMockObjectId(): Types.ObjectId {
  return new Types.ObjectId();
}
