import { ConflictError } from "../errors";
import { userRepository } from "../repositories";
import { InsertUser, RequiredBy, SelectUser } from "../types";
import { generateToken, removeObjectFields } from "../utils";

class AuthService {
  private readonly repository = userRepository;

  async signin(data: RequiredBy<SelectUser, "email" | "password">) {
    const isUserExists = await this.repository.getByEmail({
      email: data.email,
    });

    if (!isUserExists) {
      throw new ConflictError("Invalid email or password.");
    }

    const dataWithoutPassword = removeObjectFields(isUserExists, ["password"]);
    const token = generateToken({ id: dataWithoutPassword._id });
    const dataWithToken = Object.assign(dataWithoutPassword, { token });

    return dataWithToken;
  }

  async signup(data: InsertUser) {
    const isUserExists = await this.repository.existsByEmail({
      email: data.email,
    });
    if (isUserExists) {
      throw new ConflictError("An account with this email already exists.");
    }

    const createdUser = await this.repository.create(data);
    const token = generateToken({ id: createdUser._id });
    const userWithToken = Object.assign(createdUser, { token });
    const userWithoutPassword = removeObjectFields(userWithToken, ["password"]);

    return userWithoutPassword;
  }
}

export const authService = new AuthService();
