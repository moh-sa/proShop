import { SelectUser } from "../types";
import { generateJwtToken } from "./jwt-generate-token.util";
import { removeObjectFields } from "./remove-object-fields";

export function formatUserServiceResponse(data: {
  user: SelectUser;
  isTokenRequired?: boolean;
}): Omit<SelectUser, "password"> {
  const res = removeObjectFields(data.user, ["password"]);
  res.token = data.isTokenRequired
    ? generateJwtToken({ _id: data.user._id.toString() })
    : undefined;

  return res;
}
