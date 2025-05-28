import { SelectUser } from "../types";
import { generateToken } from "./jwt-generate-token.util";
import { removeObjectFields } from "./remove-object-fields";

export function formatUserServiceResponse(data: {
  user: SelectUser;
  isTokenRequired?: boolean;
}): Omit<SelectUser, "password"> {
  const res = removeObjectFields(data.user, ["password"]);
  res.token = data.isTokenRequired
    ? generateToken({ _id: data.user._id.toString() })
    : undefined;

  return res;
}
