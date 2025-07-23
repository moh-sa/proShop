import { compare } from "bcryptjs";
import { AuthenticationError } from "../errors";
import { IUserRepository, UserRepository } from "../repositories";
import { InsertUser, RequiredBy, SelectUser } from "../types";
import { generateJwtToken, removeObjectFields } from "../utils";

export interface IAuthService {
  signin: (
    data: RequiredBy<SelectUser, "email" | "password">,
  ) => Promise<Omit<SelectUser, "password">>;
  signup: (data: InsertUser) => Promise<Omit<SelectUser, "password">>;
}
export class AuthService implements IAuthService {
  private readonly _repository: IUserRepository;

  constructor(repository: IUserRepository = new UserRepository()) {
    this._repository = repository;
  }

  async signin(data: RequiredBy<SelectUser, "email" | "password">) {
    const isUserExists = await this._repository.getByEmail({
      email: data.email,
    });

    if (!isUserExists) {
      throw new AuthenticationError("Invalid email or password.");
    }

    const isPasswordValid = await compare(data.password, isUserExists.password);
    if (!isPasswordValid) {
      throw new AuthenticationError("Invalid email or password.");
    }

    const user = isUserExists;
    const token = generateJwtToken({ id: user._id });
    const userWithToken = Object.assign(user, { token });
    const userWithoutPassword = removeObjectFields(userWithToken, ["password"]);

    return userWithoutPassword;
  }

  async signup(data: InsertUser) {
    const isUserExists = await this._repository.existsByEmail({
      email: data.email,
    });
    if (isUserExists) {
      throw new AuthenticationError(
        "An account with this email already exists.",
      );
    }

    const createdUser = await this._repository.create(data);
    const token = generateJwtToken({ id: createdUser._id });
    const userWithToken = Object.assign(createdUser, { token });
    const userWithoutPassword = removeObjectFields(userWithToken, ["password"]);

    return userWithoutPassword;
  }
}
