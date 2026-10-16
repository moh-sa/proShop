import { ValidationError } from "../errors/index.js";
import { updateProfileBodySchema } from "../schemas/index.js";
import type { IPasswordService, IUserService } from "../services/index.js";
import { passwordService, userService } from "../services/index.js";
import type {
	MethodParams,
	MethodReturn,
	Result,
	SafeSelectUser,
	UpdateProfileBodyInput,
} from "../types/index.js";
import { getLoggerFromContext } from "../utils/index.js";

export interface IUserManager {
	updateProfile(
		args: UpdateProfileBodyInput & { userId: string },
	): Promise<Result<SafeSelectUser>>;
}

export class UserManager implements IUserManager {
	private readonly _password: IPasswordService;
	private readonly _user: IUserService;

	constructor(password?: IPasswordService, user?: IUserService) {
		this._password = password ?? passwordService;
		this._user = user ?? userService;
	}

	public async updateProfile(
		args: MethodParams<IUserManager, "updateProfile">,
	): MethodReturn<IUserManager, "updateProfile"> {
		const logger = this._getLogger({ method: "updateProfile" });
		const { userId, ...body } = args;

		const validationResult = updateProfileBodySchema.safeParse(body);
		if (!validationResult.success) {
			return {
				error: new ValidationError("Invalid profile update data", {
					cause: validationResult.error,
				}),
				success: false,
			};
		}

		const { currentPassword, password, ...fields } = validationResult.data;

		// verify and hash before any write, so a wrong current password changes nothing
		let hashedPassword: string | undefined;
		if (password !== undefined) {
			const userResult = await this._user.getById_UNSAFE({ userId });
			if (!userResult.success) {
				return userResult;
			}

			const verifyResult = await this._password.verify({
				hashedPassword: userResult.data.password,
				password: currentPassword ?? "",
			});
			if (!verifyResult.success) {
				logger.warn(
					{ userId },
					"Profile update failed - wrong current password",
				);
				return {
					error: new ValidationError("Current password is incorrect"),
					success: false,
				};
			}

			const hashResult = await this._password.hash({ password });
			if (!hashResult.success) {
				return hashResult;
			}
			hashedPassword = hashResult.data;
		}

		if (hashedPassword !== undefined) {
			const updatePasswordResult = await this._user.updatePassword({
				hashedPassword,
				userId,
			});
			if (!updatePasswordResult.success) {
				return updatePasswordResult;
			}
		}

		if (Object.keys(fields).length === 0) {
			return this._user.getById({ userId });
		}

		return this._user.updateById({ ...fields, userId });
	}

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({ layer: "user manager", ...args });
	}
}

export const userManager = new UserManager();
