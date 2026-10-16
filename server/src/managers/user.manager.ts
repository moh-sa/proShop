import { ForbiddenError, ValidationError } from "../errors/index.js";
import {
	setBannedBodySchema,
	updateProfileBodySchema,
} from "../schemas/index.js";
import type {
	IPasswordService,
	ISessionService,
	IUserService,
} from "../services/index.js";
import {
	passwordService,
	sessionService,
	userService,
} from "../services/index.js";
import type {
	MethodParams,
	MethodReturn,
	Result,
	SafeSelectUser,
	UpdateProfileBodyInput,
} from "../types/index.js";
import { getLoggerFromContext } from "../utils/index.js";

export interface IUserManager {
	/**
	 * Deletes the user and all their sessions.
	 */
	delete(args: { userId: string }): Promise<Result<SafeSelectUser>>;

	/**
	 * Bans or unbans a user. A ban signs the user out everywhere.
	 */
	setBanned(args: {
		actorId: string;
		body: unknown;
		userId: string;
	}): Promise<Result<SafeSelectUser>>;

	/**
	 * A password change signs out every other session of the user.
	 */
	updateProfile(
		args: UpdateProfileBodyInput & {
			currentSessionId: string;
			userId: string;
		},
	): Promise<Result<SafeSelectUser>>;
}

export class UserManager implements IUserManager {
	private readonly _password: IPasswordService;
	private readonly _session: ISessionService;
	private readonly _user: IUserService;

	constructor(
		password?: IPasswordService,
		session?: ISessionService,
		user?: IUserService,
	) {
		this._password = password ?? passwordService;
		this._session = session ?? sessionService;
		this._user = user ?? userService;
	}

	public async delete(
		args: MethodParams<IUserManager, "delete">,
	): MethodReturn<IUserManager, "delete"> {
		const deleteResult = await this._user.delete({ userId: args.userId });
		if (!deleteResult.success) {
			return deleteResult;
		}

		const sessionsResult = await this._session.deleteAllByUserId({
			userId: args.userId,
		});
		if (!sessionsResult.success) {
			return sessionsResult;
		}

		return deleteResult;
	}

	public async setBanned(
		args: MethodParams<IUserManager, "setBanned">,
	): MethodReturn<IUserManager, "setBanned"> {
		const logger = this._getLogger({ method: "setBanned" });

		const validationResult = setBannedBodySchema.safeParse(args.body);
		if (!validationResult.success) {
			return {
				error: new ValidationError("Invalid ban data", {
					cause: validationResult.error,
				}),
				success: false,
			};
		}

		if (args.actorId === args.userId) {
			logger.warn({ userId: args.userId }, "Blocked self ban");
			return {
				error: new ForbiddenError("You cannot ban yourself"),
				success: false,
			};
		}

		// ban first: the guard rejects banned users, so a failed session cleanup still locks them out
		const banned = validationResult.data.banned;
		const updateResult = await this._user.updateBannedAt({
			bannedAt: banned ? new Date() : null,
			userId: args.userId,
		});
		if (!updateResult.success) {
			return updateResult;
		}

		if (banned) {
			const sessionsResult = await this._session.deleteAllByUserId({
				userId: args.userId,
			});
			if (!sessionsResult.success) {
				return sessionsResult;
			}
		}

		return updateResult;
	}

	public async updateProfile(
		args: MethodParams<IUserManager, "updateProfile">,
	): MethodReturn<IUserManager, "updateProfile"> {
		const logger = this._getLogger({ method: "updateProfile" });
		const { currentSessionId, userId, ...body } = args;

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

			const sessionsResult = await this._session.deleteAllByUserIdExcept({
				exceptSessionId: currentSessionId,
				userId,
			});
			if (!sessionsResult.success) {
				return sessionsResult;
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
