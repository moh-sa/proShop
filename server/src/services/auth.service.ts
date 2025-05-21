import { compare } from "bcryptjs";
import { ConflictError, ValidationError } from "../errors";
import { IUserRepository, UserRepository } from "../repositories";
import { InsertUser, RequiredBy, SelectUser } from "../types";
import { generateToken, removeObjectFields } from "../utils";

export interface IAuthService {
  signin: (
    data: RequiredBy<SelectUser, "email" | "password">,
  ) => Promise<Omit<SelectUser, "password">>;
  signup: (data: InsertUser) => Promise<Omit<SelectUser, "password">>;
}
export class AuthService implements IAuthService {
  private readonly repository: IUserRepository;

  constructor(repository: IUserRepository = new UserRepository()) {
    this.repository = repository;
  }

  async signin(data: RequiredBy<SelectUser, "email" | "password">) {
    const isUserExists = await this.repository.getByEmail({
      email: data.email,
    });

    if (!isUserExists) {
      throw new ConflictError("Invalid email or password.");
    }

    const isPasswordValid = await compare(data.password, isUserExists.password);
    if (!isPasswordValid) {
      throw new ValidationError("Invalid email or password.");
    }

    const user = isUserExists;
    const token = generateToken({ id: user._id });
    const userWithToken = Object.assign(user, { token });
    const userWithoutPassword = removeObjectFields(userWithToken, ["password"]);

    return userWithoutPassword;
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
