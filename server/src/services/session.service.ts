import type { ISessionRepository } from "../repositories/session.repository.js";
import type {
	FailureResult,
	InsertSession,
	Result,
	SelectSession,
} from "../types/index.js";

import {
	BaseError,
	DatabaseDuplicateKeyError,
	SessionAlreadyExistsError,
	SessionAlreadyRevokedError,
	SessionBaseError,
	SessionExpiredError,
	SessionNotFoundError,
	SessionValidationError,
} from "../errors/index.js";
import { SessionRepository } from "../repositories/index.js";
import { insertSessionSchema } from "../schemas/index.js";

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
		args: InsertSession,
	): Promise<SessionResult<SelectSession>> {
		try {
			const session = await this._repository.create(args);

			return {
				data: session,
				success: true,
			};
		} catch (error) {
			if (error instanceof DatabaseDuplicateKeyError) {
				return {
					error: new SessionAlreadyExistsError(),
					success: false,
				};
			}

			return this._handleError(error);
		}
	}

	public async deleteAllByUserId(args: {
		userId: string;
	}): Promise<SessionResult<number>> {
		try {
			const deletedCount = await this._repository.deleteAllByUserId(args);

			return {
				data: deletedCount,
				success: true,
			};
		} catch (error) {
			return this._handleError(error);
		}
	}

	public async deleteByTokenIdAndUserId(args: {
		tokenId: string;
		userId: string;
	}): Promise<SessionResult<SelectSession>> {
		try {
			const session = await this._repository.deleteByTokenIdAndUserId(args);
			if (!session) {
				return {
					error: new SessionNotFoundError(),
					success: false,
				};
			}

			return {
				data: session,
				success: true,
			};
		} catch (error) {
			return this._handleError(error);
		}
	}

	public async getActiveByUserId(args: {
		userId: string;
	}): Promise<SessionResult<Array<SelectSession>>> {
		try {
			const sessions = await this._repository.getAllActiveByUserId({
				userId: args.userId,
			});

			return {
				data: sessions,
				success: true,
			};
		} catch (error) {
			return this._handleError(error);
		}
	}

	public async getByTokenIdAndUserId(args: {
		tokenId: string;
		userId: string;
	}): Promise<SessionResult<SelectSession>> {
		try {
			const session = await this._repository.getByTokenIdAndUserId({
				tokenId: args.tokenId,
				userId: args.userId,
			});

			if (!session) {
				return {
					error: new SessionNotFoundError(),
					success: false,
				};
			}

			return {
				data: session,
				success: true,
			};
		} catch (error) {
			return this._handleError(error);
		}
	}

	public async revokeAllByUserId(args: {
		userId: string;
	}): Promise<SessionResult<number>> {
		try {
			const revokedCount = await this._repository.revokeAllByUserId(args);
			return { data: revokedCount, success: true };
		} catch (error) {
			return this._handleError(error);
		}
	}

	public async revokeByTokenIdAndUserId(args: {
		tokenId: string;
		userId: string;
	}): Promise<SessionResult<SelectSession>> {
		try {
			const revokedSession =
				await this._repository.revokeByTokenIdAndUserId(args);

			if (!revokedSession) {
				return {
					error: new SessionNotFoundError(),
					success: false,
				};
			}

			return {
				data: revokedSession,
				success: true,
			};
		} catch (error) {
			return this._handleError(error);
		}
	}

	/**
	 * Validates a session by checking if it exists, is not revoked, and is not expired.
	 */
	public async validate(args: {
		tokenId: string;
		userId: string;
	}): Promise<SessionResult<SelectSession>> {
		try {
			const session = await this._repository.getByTokenIdAndUserId(args);

			if (!session) {
				return {
					error: new SessionNotFoundError(),
					success: false,
				};
			}

			if (session.revokedAt) {
				return {
					error: new SessionAlreadyRevokedError(),
					success: false,
				};
			}

			if (session.expiresAt <= new Date()) {
				return {
					error: new SessionExpiredError(),
					success: false,
				};
			}

			return {
				data: session,
				success: true,
			};
		} catch (error) {
			return this._handleError(error);
		}
	}

	private _handleError(error: unknown): FailureResult<SessionBaseError> {
		if (error instanceof BaseError) {
			return { error, success: false };
		}

		if (error instanceof Error) {
			return {
				error: new SessionBaseError(`Session operation failed: ${error}`),
				success: false,
			};
		}

		return {
			error: new SessionBaseError(
				`Unexpected error occurred: ${String(error)}`,
			),
			success: false,
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
}
