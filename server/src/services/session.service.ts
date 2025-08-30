import type { ISessionRepository } from "../repositories/session.repository.js";
import type { FailureResult, Result } from "../types/index.js";

import { BaseError, SessionBaseError } from "../errors/index.js";
import { SessionRepository } from "../repositories/index.js";

export interface ISessionService {}

type SessionResult<T> = Result<T, SessionBaseError>;

export class SessionService implements ISessionService {
	private readonly _repository: ISessionRepository;

	constructor(repository: ISessionRepository = new SessionRepository()) {
		this._repository = repository;
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
