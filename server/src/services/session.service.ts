import { z } from "zod";

import type { SessionBaseError } from "../errors/index.js";
import type { ISessionRepository } from "../repositories/session.repository.js";
import type {
	InsertSession,
	MethodParams,
	MethodReturn,
	PaginatedResponse,
	Result,
	SelectSession,
	SessionPaginationParams,
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
import {
	objectIdStringValidator,
	objectIdValidator,
	paginationParamsValidator,
	uuidValidator,
} from "../validators/index.js";

export interface ISessionService {
	create(args: InsertSession): Promise<SessionResult<SelectSession>>;

	deleteAllByUserId(args: { userId: string }): Promise<SessionResult<number>>;

	deleteByTokenIdAndUserId(args: {
		tokenId: string;
		userId: string;
	}): Promise<SessionResult<SelectSession>>;

	getActiveByUserId(
		args: SessionPaginationParams,
	): Promise<SessionResult<PaginatedResponse<SelectSession>>>;

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
		const userIdResult = this._validateUserId(args.userId);
		if (!userIdResult.success) {
			return userIdResult;
		}

		const result = await this._repository.deleteAllByUserId({
			userId: userIdResult.data,
		});
		if (!result.success) {
			return result;
		}

		return {
			data: result.data,
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
		const paginationResult = paginationParamsValidator.safeParse({
			pageNumber: args.pageNumber,
			pageSize: args.pageSize,
			sort: args.sort,
		});
		if (!paginationResult.success) {
			return {
				error: new SessionValidationError({
					cause: paginationResult.error,
				}),
				success: false,
			};
		}

		const userIdResult = this._validateUserId(args.userId);
		if (!userIdResult.success) {
			return userIdResult;
		}

		const sessions = await this._repository.getAllActiveByUserId({
			pageNumber: paginationResult.data.pageNumber,
			pageSize: paginationResult.data.pageSize,
			sort: paginationResult.data.sort,
			userId: userIdResult.data,
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
		const userIdResult = this._validateUserId(args.userId);
		if (!userIdResult.success) {
			return userIdResult;
		}

		const result = await this._repository.revokeAllByUserId({
			userId: userIdResult.data,
		});
		if (!result.success) {
			return result;
		}

		return { data: result.data, success: true };
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

	private _validateUserId(userId: string): SessionResult<string> {
		const userIdValidationResult =
			objectIdStringValidator("User ID").safeParse(userId);
		if (!userIdValidationResult.success) {
			return {
				error: new SessionValidationError({
					cause: userIdValidationResult.error.errors,
				}),
				success: false,
			};
		}
		return { data: userIdValidationResult.data, success: true };
	}
}
