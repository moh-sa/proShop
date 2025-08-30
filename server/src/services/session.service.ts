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
	SessionBaseError,
} from "../errors/index.js";
import { SessionRepository } from "../repositories/index.js";

export interface ISessionService {
	create(args: InsertSession): Promise<SessionResult<SelectSession>>;
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
