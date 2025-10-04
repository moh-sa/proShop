import { z } from "zod";

import type { SessionBaseError } from "../errors/index.js";
import type { ISessionRepository } from "../repositories/session.repository.js";
import type {
	InsertSession,
	MethodParams,
	MethodReturn,
	Result,
	SelectSession,
} from "../types/index.js";

import {
	DatabaseDuplicateKeyError,
	SessionAlreadyExistsError,
	SessionAlreadyRevokedError,
	SessionExpiredError,
	SessionNotFoundError,
	SessionValidationError,
} from "../errors/index.js";
import { SessionRepository } from "../repositories/index.js";
import { insertSessionSchema } from "../schemas/index.js";
import { objectIdValidator, uuidValidator } from "../validators/index.js";

export interface ISessionService {
	create(args: InsertSession): Promise<SessionResult<SelectSession>>;

	deleteAllByUserId(args: { userId: string }): Promise<SessionResult<number>>;

	deleteByTokenIdAndUserId(args: {
		tokenId: string;
		userId: string;
	}): Promise<SessionResult<SelectSession>>;

	getActiveByUserId(args: {
		userId: string;
	}): Promise<SessionResult<Array<SelectSession>>>;

	getByTokenIdAndUserId(args: {
		tokenId: string;
		userId: string;
	}): Promise<SessionResult<SelectSession>>;

	revokeAllByUserId(args: { userId: string }): Promise<SessionResult<number>>;

	revokeByTokenIdAndUserId(args: {
		tokenId: string;
		userId: string;
	}): Promise<SessionResult<SelectSession>>;

	/**
	 * Validates a session by checking if it exists, is not revoked, and is not expired.
	 */
	validate(args: {
		tokenId: string;
		userId: string;
	}): Promise<SessionResult<SelectSession>>;
}

type SessionResult<T> = Result<T, SessionBaseError>;

export class SessionService implements ISessionService {
	private readonly _repository: ISessionRepository;

	constructor(repository: ISessionRepository = new SessionRepository()) {
		this._repository = repository;
	}

	public async create(
		args: MethodParams<ISessionService, "create">,
	): MethodReturn<ISessionService, "create"> {
		const argsValidationResult = this._validateCreateArgs(args);
		if (!argsValidationResult.success) {
			return argsValidationResult;
		}

		const session = await this._repository.create(args);
		if (!session.success) {
			if (session.error instanceof DatabaseDuplicateKeyError) {
				return {
					error: new SessionAlreadyExistsError({ cause: session.error }),
					success: false,
				};
			}
			return session;
		}

		return {
			data: session.data,
			success: true,
		};
	}

	public async deleteAllByUserId(
		args: MethodParams<ISessionService, "deleteAllByUserId">,
	): MethodReturn<ISessionService, "deleteAllByUserId"> {
		const argsValidationResult = this._validateUserId(args.userId);
		if (!argsValidationResult.success) {
			return argsValidationResult;
		}

		const deletedCount = await this._repository.deleteAllByUserId(args);
		if (!deletedCount.success) {
			return deletedCount;
		}

		return {
			data: deletedCount.data,
			success: true,
		};
	}

	public async deleteByTokenIdAndUserId(
		args: MethodParams<ISessionService, "deleteByTokenIdAndUserId">,
	): MethodReturn<ISessionService, "deleteByTokenIdAndUserId"> {
		const argsValidationResult = this._validateTokenIdAndUserId(
			args.tokenId,
			args.userId,
		);
		if (!argsValidationResult.success) {
			return argsValidationResult;
		}

		const session = await this._repository.deleteByTokenIdAndUserId(args);
		if (!session.success) {
			return session;
		}

		if (!session.data) {
			return {
				error: new SessionNotFoundError(),
				success: false,
			};
		}

		return {
			data: session.data,
			success: true,
		};
	}

	public async getActiveByUserId(
		args: MethodParams<ISessionService, "getActiveByUserId">,
	): MethodReturn<ISessionService, "getActiveByUserId"> {
		const argsValidationResult = this._validateUserId(args.userId);
		if (!argsValidationResult.success) {
			return argsValidationResult;
		}

		const sessions = await this._repository.getAllActiveByUserId({
			userId: args.userId,
		});
		if (!sessions.success) {
			return sessions;
		}

		return {
			data: sessions.data,
			success: true,
		};
	}

	public async getByTokenIdAndUserId(
		args: MethodParams<ISessionService, "getByTokenIdAndUserId">,
	): MethodReturn<ISessionService, "getByTokenIdAndUserId"> {
		const argsValidationResult = this._validateTokenIdAndUserId(
			args.tokenId,
			args.userId,
		);
		if (!argsValidationResult.success) {
			return argsValidationResult;
		}

		const session = await this._repository.getByTokenIdAndUserId({
			tokenId: args.tokenId,
			userId: args.userId,
		});
		if (!session.success) {
			return session;
		}

		if (!session.data) {
			return {
				error: new SessionNotFoundError(),
				success: false,
			};
		}

		return {
			data: session.data,
			success: true,
		};
	}

	public async revokeAllByUserId(
		args: MethodParams<ISessionService, "revokeAllByUserId">,
	): MethodReturn<ISessionService, "revokeAllByUserId"> {
		const argsValidationResult = this._validateUserId(args.userId);
		if (!argsValidationResult.success) {
			return argsValidationResult;
		}

		const revokedCount = await this._repository.revokeAllByUserId(args);
		if (!revokedCount.success) {
			return revokedCount;
		}

		return { data: revokedCount.data, success: true };
	}

	public async revokeByTokenIdAndUserId(
		args: MethodParams<ISessionService, "revokeByTokenIdAndUserId">,
	): MethodReturn<ISessionService, "revokeByTokenIdAndUserId"> {
		const argsValidationResult = this._validateTokenIdAndUserId(
			args.tokenId,
			args.userId,
		);
		if (!argsValidationResult.success) {
			return argsValidationResult;
		}

		const revokedSession =
			await this._repository.revokeByTokenIdAndUserId(args);

		if (!revokedSession.success) {
			return revokedSession;
		}

		if (!revokedSession.data) {
			return {
				error: new SessionNotFoundError(),
				success: false,
			};
		}

		return {
			data: revokedSession.data,
			success: true,
		};
	}

	/**
	 * Validates a session by checking if it exists, is not revoked, and is not expired.
	 */
	public async validate(
		args: MethodParams<ISessionService, "validate">,
	): MethodReturn<ISessionService, "validate"> {
		const argsValidationResult = this._validateTokenIdAndUserId(
			args.tokenId,
			args.userId,
		);
		if (!argsValidationResult.success) {
			return argsValidationResult;
		}

		const session = await this._repository.getByTokenIdAndUserId(args);
		if (!session.success) {
			return session;
		}

		if (!session.data) {
			return {
				error: new SessionNotFoundError(),
				success: false,
			};
		}

		if (session.data.revokedAt) {
			return {
				error: new SessionAlreadyRevokedError(),
				success: false,
			};
		}

		if (session.data.expiresAt <= new Date()) {
			return {
				error: new SessionExpiredError(),
				success: false,
			};
		}

		return {
			data: session.data,
			success: true,
		};
	}

	private _validateCreateArgs(args: InsertSession): SessionResult<undefined> {
		const argsValidationResult = insertSessionSchema.safeParse(args);
		if (!argsValidationResult.success) {
			return {
				error: new SessionValidationError({
					cause: argsValidationResult.error.errors,
				}),
				success: false,
			};
		}
		return { data: undefined, success: true };
	}

	private _validateTokenIdAndUserId(
		tokenId: string,
		userId: string,
	): SessionResult<undefined> {
		const argsValidationResult = z
			.object({
				tokenId: uuidValidator("tokenId"),
				userId: objectIdValidator,
			})
			.safeParse({ tokenId, userId });
		if (!argsValidationResult.success) {
			return {
				error: new SessionValidationError({
					cause: argsValidationResult.error.errors,
				}),
				success: false,
			};
		}

		return { data: undefined, success: true };
	}

	private _validateUserId(userId: string): SessionResult<undefined> {
		const userIdValidationResult = objectIdValidator.safeParse(userId);
		if (!userIdValidationResult.success) {
			return {
				error: new SessionValidationError({
					cause: userIdValidationResult.error.errors,
				}),
				success: false,
			};
		}
		return { data: undefined, success: true };
	}
}
