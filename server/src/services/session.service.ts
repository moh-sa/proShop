import type { Types } from "mongoose";

import { z } from "zod";

import type { SessionBaseError } from "../errors/index.js";
import type { ISessionRepository } from "../repositories/session.repository.js";
import type {
	CreateSession,
	GetAllSessionsByUserIdServiceParams,
	MethodParams,
	MethodReturn,
	PaginatedResponse,
	Result,
	Session,
} from "../types/index.js";

import {
	DatabaseDuplicateKeyError,
	SessionAlreadyExistsError,
	SessionAlreadyRevokedError,
	SessionExpiredError,
	SessionNotFoundError,
	SessionValidationError,
} from "../errors/index.js";
import { sessionRepository } from "../repositories/index.js";
import {
	createSessionSchema,
	sessionByUserIdPaginationParamsSchema,
} from "../schemas/index.js";
import { getLoggerFromContext } from "../utils/index.js";
import { objectIdValidator, uuidValidator } from "../validators/index.js";

export interface ISessionService {
	create(args: CreateSession): Promise<SessionResult<Session>>;

	deleteAllByUserId(args: { userId: string }): Promise<SessionResult<number>>;

	deleteByTokenIdAndUserId(args: {
		tokenId: string;
		userId: string;
	}): Promise<SessionResult<Session>>;

	getActiveByUserId(
		args: GetAllSessionsByUserIdServiceParams,
	): Promise<SessionResult<PaginatedResponse<Session>>>;

	getByTokenIdAndUserId(args: {
		tokenId: string;
		userId: string;
	}): Promise<SessionResult<Session>>;

	revokeAllByUserId(args: { userId: string }): Promise<SessionResult<number>>;

	revokeByTokenIdAndUserId(args: {
		tokenId: string;
		userId: string;
	}): Promise<SessionResult<Session>>;

	/**
	 * Validates a session by checking if it exists, is not revoked, and is not expired.
	 */
	validate(args: {
		tokenId: string;
		userId: string;
	}): Promise<SessionResult<Session>>;
}

type SessionResult<T> = Result<T, SessionBaseError>;

export class SessionService implements ISessionService {
	private readonly _repository: ISessionRepository;

	constructor(repository?: ISessionRepository) {
		this._repository = repository ?? sessionRepository;
	}

	public async create(
		args: MethodParams<ISessionService, "create">,
	): MethodReturn<ISessionService, "create"> {
		const logger = this._getLogger({ method: "create" });
		logger.debug({ args }, "Creating session");

		const argsValidationResult = this._validateCreateArgs(args);
		if (!argsValidationResult.success) {
			logger.warn(
				{ error: argsValidationResult.error },
				"Invalid session creation data",
			);
			return argsValidationResult;
		}

		logger.debug(
			{ validatedData: argsValidationResult.data },
			"Validated session creation data",
		);

		const session = await this._repository.create(args);
		if (!session.success) {
			logger.warn(
				{ error: session.error, tokenId: args.tokenId, userId: args.userId },
				"Failed to create session",
			);

			if (session.error instanceof DatabaseDuplicateKeyError) {
				return {
					error: new SessionAlreadyExistsError({ cause: session.error }),
					success: false,
				};
			}
			return session;
		}

		logger.info(
			{
				sessionId: session.data.id,
				tokenId: args.tokenId,
				userId: args.userId,
			},
			"Session created successfully",
		);
		return {
			data: session.data,
			success: true,
		};
	}

	public async deleteAllByUserId(
		args: MethodParams<ISessionService, "deleteAllByUserId">,
	): MethodReturn<ISessionService, "deleteAllByUserId"> {
		const logger = this._getLogger({ method: "deleteAllByUserId" });
		logger.debug({ args }, "Deleting all sessions by user ID");

		const userIdResult = this._validateUserId(args.userId);
		if (!userIdResult.success) {
			logger.warn(
				{ error: userIdResult.error, userId: args.userId },
				"Invalid user ID",
			);
			return userIdResult;
		}

		logger.debug({ validatedUserId: userIdResult.data }, "Validated user ID");

		const result = await this._repository.deleteAllByUserId({
			userId: userIdResult.data,
		});
		if (!result.success) {
			logger.warn(
				{ error: result.error, userId: args.userId },
				"Failed to delete all sessions",
			);
			return result;
		}

		logger.info(
			{ deletedCount: result.data, userId: args.userId },
			"All sessions deleted",
		);
		return {
			data: result.data,
			success: true,
		};
	}

	public async deleteByTokenIdAndUserId(
		args: MethodParams<ISessionService, "deleteByTokenIdAndUserId">,
	): MethodReturn<ISessionService, "deleteByTokenIdAndUserId"> {
		const logger = this._getLogger({ method: "deleteByTokenIdAndUserId" });
		logger.debug({ args }, "Deleting session by token ID and user ID");

		const argsValidationResult = this._validateTokenIdAndUserId(
			args.tokenId,
			args.userId,
		);
		if (!argsValidationResult.success) {
			logger.warn(
				{
					error: argsValidationResult.error,
					tokenId: args.tokenId,
					userId: args.userId,
				},
				"Invalid token ID or user ID",
			);
			return argsValidationResult;
		}

		logger.debug(
			{ validatedData: argsValidationResult.data },
			"Validated token ID and user ID",
		);

		const session = await this._repository.deleteByTokenIdAndUserId(
			argsValidationResult.data,
		);
		if (!session.success) {
			logger.warn(
				{ error: session.error, tokenId: args.tokenId, userId: args.userId },
				"Failed to delete session",
			);
			return session;
		}

		if (!session.data) {
			logger.warn(
				{ tokenId: args.tokenId, userId: args.userId },
				"Session not found",
			);
			return {
				error: new SessionNotFoundError(),
				success: false,
			};
		}

		logger.info(
			{
				sessionId: session.data.id,
				tokenId: args.tokenId,
				userId: args.userId,
			},
			"Session deleted successfully",
		);

		return {
			data: session.data,
			success: true,
		};
	}

	public async getActiveByUserId(
		args: MethodParams<ISessionService, "getActiveByUserId">,
	): MethodReturn<ISessionService, "getActiveByUserId"> {
		const logger = this._getLogger({ method: "getActiveByUserId" });
		logger.debug({ args }, "Getting active sessions by user ID");

		// validate arguments
		const argsValidationResult = sessionByUserIdPaginationParamsSchema
			.omit({ filters: true })
			.safeParse(args);
		if (!argsValidationResult.success) {
			logger.warn(
				{ error: argsValidationResult.error, userId: args.userId },
				"Invalid arguments data",
			);
			return {
				error: new SessionValidationError({
					cause: argsValidationResult.error,
				}),
				success: false,
			};
		}

		logger.debug(
			{ validatedArgs: argsValidationResult.data },
			"Validated arguments data",
		);

		// repository call
		const sessions = await this._repository.getAllActiveByUserId(
			argsValidationResult.data,
		);
		if (!sessions.success) {
			logger.warn(
				{ error: sessions.error, userId: args.userId },
				"Failed to get active sessions",
			);
			return sessions;
		}

		logger.info(
			{ totalSessions: sessions.data.meta.totalItems, userId: args.userId },
			"Active sessions retrieved successfully",
		);

		return {
			data: sessions.data,
			success: true,
		};
	}

	public async getByTokenIdAndUserId(
		args: MethodParams<ISessionService, "getByTokenIdAndUserId">,
	): MethodReturn<ISessionService, "getByTokenIdAndUserId"> {
		const logger = this._getLogger({ method: "getByTokenIdAndUserId" });
		logger.debug({ args }, "Getting session by token ID and user ID");

		const argsValidationResult = this._validateTokenIdAndUserId(
			args.tokenId,
			args.userId,
		);
		if (!argsValidationResult.success) {
			logger.warn(
				{
					error: argsValidationResult.error,
					tokenId: args.tokenId,
					userId: args.userId,
				},
				"Invalid token ID or user ID",
			);
			return argsValidationResult;
		}

		logger.debug(
			{ validatedData: argsValidationResult.data },
			"Validated token ID and user ID",
		);

		const session = await this._repository.getByTokenIdAndUserId(
			argsValidationResult.data,
		);
		if (!session.success) {
			logger.warn(
				{ error: session.error, tokenId: args.tokenId, userId: args.userId },
				"Failed to get session",
			);
			return session;
		}

		if (!session.data) {
			logger.warn(
				{ tokenId: args.tokenId, userId: args.userId },
				"Session not found",
			);
			return {
				error: new SessionNotFoundError(),
				success: false,
			};
		}

		logger.info(
			{
				sessionId: session.data.id,
				tokenId: args.tokenId,
				userId: args.userId,
			},
			"Session retrieved successfully",
		);

		return {
			data: session.data,
			success: true,
		};
	}

	public async revokeAllByUserId(
		args: MethodParams<ISessionService, "revokeAllByUserId">,
	): MethodReturn<ISessionService, "revokeAllByUserId"> {
		const logger = this._getLogger({ method: "revokeAllByUserId" });
		logger.debug({ args }, "Revoking all sessions by user ID");

		const userIdResult = this._validateUserId(args.userId);
		if (!userIdResult.success) {
			logger.warn(
				{ error: userIdResult.error, userId: args.userId },
				"Invalid user ID",
			);
			return userIdResult;
		}

		logger.debug({ validatedUserId: userIdResult.data }, "Validated user ID");

		const result = await this._repository.revokeAllByUserId({
			userId: userIdResult.data,
		});
		if (!result.success) {
			logger.warn(
				{ error: result.error, userId: args.userId },
				"Failed to revoke all sessions",
			);
			return result;
		}

		logger.info(
			{ revokedCount: result.data, userId: args.userId },
			"All sessions revoked",
		);
		return { data: result.data, success: true };
	}

	public async revokeByTokenIdAndUserId(
		args: MethodParams<ISessionService, "revokeByTokenIdAndUserId">,
	): MethodReturn<ISessionService, "revokeByTokenIdAndUserId"> {
		const logger = this._getLogger({ method: "revokeByTokenIdAndUserId" });
		logger.debug({ args }, "Revoking session by token ID and user ID");

		const argsValidationResult = this._validateTokenIdAndUserId(
			args.tokenId,
			args.userId,
		);
		if (!argsValidationResult.success) {
			logger.warn(
				{
					error: argsValidationResult.error,
					tokenId: args.tokenId,
					userId: args.userId,
				},
				"Invalid token ID or user ID",
			);
			return argsValidationResult;
		}

		logger.debug(
			{ validatedData: argsValidationResult.data },
			"Validated token ID and user ID",
		);

		const revokedSession = await this._repository.revokeByTokenIdAndUserId(
			argsValidationResult.data,
		);

		if (!revokedSession.success) {
			logger.warn(
				{
					error: revokedSession.error,
					tokenId: args.tokenId,
					userId: args.userId,
				},
				"Failed to revoke session",
			);
			return revokedSession;
		}

		if (!revokedSession.data) {
			logger.warn(
				{ tokenId: args.tokenId, userId: args.userId },
				"Session not found",
			);
			return {
				error: new SessionNotFoundError(),
				success: false,
			};
		}

		logger.info(
			{
				sessionId: revokedSession.data.id,
				tokenId: args.tokenId,
				userId: args.userId,
			},
			"Session revoked successfully",
		);

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
		const logger = this._getLogger({ method: "validate" });
		logger.debug({ args }, "Validating session by token ID and user ID");

		const argsValidationResult = this._validateTokenIdAndUserId(
			args.tokenId,
			args.userId,
		);
		if (!argsValidationResult.success) {
			logger.warn(
				{ error: argsValidationResult.error, tokenId: args.tokenId },
				"Invalid token ID or user ID",
			);
			return argsValidationResult;
		}

		logger.debug(
			{ validatedData: argsValidationResult.data },
			"Validated token ID and user ID",
		);

		const session = await this._repository.getByTokenIdAndUserId(
			argsValidationResult.data,
		);
		if (!session.success) {
			logger.warn(
				{ error: session.error, tokenId: args.tokenId, userId: args.userId },
				"Failed to get session",
			);
			return session;
		}

		if (!session.data) {
			logger.warn(
				{ tokenId: args.tokenId, userId: args.userId },
				"Session not found",
			);
			return {
				error: new SessionNotFoundError(),
				success: false,
			};
		}

		if (session.data.revokedAt) {
			logger.warn(
				{ sessionId: session.data.id, tokenId: args.tokenId },
				"Session already revoked",
			);
			return {
				error: new SessionAlreadyRevokedError(),
				success: false,
			};
		}

		if (session.data.expiresAt <= new Date()) {
			logger.warn(
				{
					expiresAt: session.data.expiresAt,
					sessionId: session.data.id,
					tokenId: args.tokenId,
				},
				"Session expired",
			);
			return {
				error: new SessionExpiredError(),
				success: false,
			};
		}

		logger.info(
			{
				sessionId: session.data.id,
				tokenId: args.tokenId,
				userId: args.userId,
			},
			"Session validated successfully",
		);
		return {
			data: session.data,
			success: true,
		};
	}

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({ layer: "session service", ...args });
	}

	private _validateCreateArgs(args: CreateSession): SessionResult<undefined> {
		const argsValidationResult = createSessionSchema.safeParse(args);
		if (!argsValidationResult.success) {
			return {
				error: new SessionValidationError({
					cause: argsValidationResult.error,
				}),
				success: false,
			};
		}
		return { data: undefined, success: true };
	}

	private _validateTokenIdAndUserId(
		tokenId: string,
		userId: string,
	): SessionResult<{ tokenId: string; userId: Types.ObjectId }> {
		const argsValidationResult = z
			.object({
				tokenId: uuidValidator("tokenId"),
				userId: objectIdValidator,
			})
			.safeParse({ tokenId, userId });
		if (!argsValidationResult.success) {
			return {
				error: new SessionValidationError({
					cause: argsValidationResult.error,
				}),
				success: false,
			};
		}

		return { data: argsValidationResult.data, success: true };
	}

	private _validateUserId(userId: string): SessionResult<Types.ObjectId> {
		const userIdValidationResult = objectIdValidator.safeParse(userId);
		if (!userIdValidationResult.success) {
			return {
				error: new SessionValidationError({
					cause: userIdValidationResult.error,
				}),
				success: false,
			};
		}
		return { data: userIdValidationResult.data, success: true };
	}
}

export const sessionService = new SessionService();
