import type { IUserRepository } from "../repositories/index.js";
import type {
	InsertUser,
	MethodParams,
	MethodReturn,
	RequiredBy,
	SelectUser,
} from "../types/index.js";
import type { IJwtService } from "./jwt.service.js";
import type { IPasswordService } from "./password.service.js";

import { AuthenticationError } from "../errors/index.js";
import { UserRepository } from "../repositories/index.js";
import { generateJwtToken, removeObjectFields } from "../utils/index.js";
import { JwtService } from "./jwt.service.js";
import { PasswordService } from "./password.service.js";

export interface IAuthService {
	signin: (
		data: RequiredBy<SelectUser, "email" | "password">,
	) => Promise<Omit<SelectUser, "password">>;
	signup: (data: InsertUser) => Promise<Omit<SelectUser, "password">>;
}
export class AuthService implements IAuthService {
	private readonly _jwtService: IJwtService;
	private readonly _passwordService: IPasswordService;
	private readonly _repository: IUserRepository;

	constructor(
		repository: IUserRepository = new UserRepository(),
		passwordService: IPasswordService = new PasswordService(),
		jwtService: IJwtService = new JwtService(),
	) {
		this._repository = repository;
		this._passwordService = passwordService;
		this._jwtService = jwtService;
	}

	async signin(
		data: MethodParams<IAuthService, "signin">,
	): MethodReturn<IAuthService, "signin"> {
		const isUserExists = await this._repository.getByEmail({
			email: data.email,
		});

		if (!isUserExists) {
			throw new AuthenticationError("Invalid email or password.");
		}

		const isPasswordValid = await this._passwordService.verify({
			hashedPassword: isUserExists.password,
			password: data.password,
		});
		if (!isPasswordValid.success) {
			throw new AuthenticationError("Invalid email or password.");
		}

		const user = isUserExists;
		const token = generateJwtToken({ id: user._id });
		const userWithToken = Object.assign(user, { token });
		const userWithoutPassword = removeObjectFields(userWithToken, ["password"]);

		return userWithoutPassword;
	}

	async signup(
		data: MethodParams<IAuthService, "signup">,
	): MethodReturn<IAuthService, "signup"> {
		const isUserExists = await this._repository.existsByEmail({
			email: data.email,
		});
		if (isUserExists) {
			throw new AuthenticationError(
				"An account with this email already exists.",
			);
		}

		const hashedPasswordResult = await this._passwordService.hash({
			password: data.password,
		});
		if (!hashedPasswordResult.success) {
			throw hashedPasswordResult.error;
		}
		const createdUser = await this._repository.create({
			...data,
			password: hashedPasswordResult.data,
		});
		const token = generateJwtToken({ id: createdUser._id });
		const userWithToken = Object.assign(createdUser, { token });
		const userWithoutPassword = removeObjectFields(userWithToken, ["password"]);

		return userWithoutPassword;
	}
}
