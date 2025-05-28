import { SelectUser } from "../types";
import { generateJwtToken } from "./jwt-generate-token.util";
import { removeObjectFields } from "./remove-object-fields";

export function formatUserServiceResponse(data: {
  user: SelectUser;
  isTokenRequired?: boolean;
}): Omit<SelectUser, "password"> {
  const res = removeObjectFields(data.user, ["password", "token"]);

  return {
    ...res,
    ...(data.isTokenRequired && {
      token: generateJwtToken({ id: data.user._id }),
    }),
  };
}
