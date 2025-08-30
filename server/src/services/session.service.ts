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
} from "../errors/index.js";
import { SessionRepository } from "../repositories/index.js";

export interface ISessionService {
	create(args: InsertSession): Promise<SessionResult<SelectSession>>;

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
}
