import { RequiredBy, SelectUser } from "../types";
import { generateToken, removeObjectFields } from "../utils";

class AuthService {
  signin(data: RequiredBy<SelectUser, "email" | "password">) {
    const dataWithoutPassword = removeObjectFields(data, ["password"]);
    const token = generateToken({ id: dataWithoutPassword._id });
    const dataWithToken = Object.assign(dataWithoutPassword, { token });

    return dataWithToken;
  }

  async signup(data: SelectUser) {
    const dataWithoutPassword = removeObjectFields(data, ["password"]);
    const token = generateToken({ id: dataWithoutPassword._id });
    const dataWithToken = Object.assign(dataWithoutPassword, { token });

    return dataWithToken;
  }
}

export const authService = new AuthService();
