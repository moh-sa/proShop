import { SelectUser } from "../types";
import { generateToken } from "./generateJwtToken";

export function formatUserServiceResponse(
  user: Partial<SelectUser>,
  isTokenRequired = false,
) {
  const response: typeof user & { token?: string } = {
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
  };

  if (isTokenRequired) response.token = generateToken({ id: user._id });
  return response;
}
