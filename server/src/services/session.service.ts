import type { SessionBaseError } from "../errors/index.js";
import type { ISessionRepository } from "../repositories/session.repository.js";
import type { Result } from "../types/index.js";

import { SessionRepository } from "../repositories/index.js";

export interface ISessionService {}

type SessionResult<T> = Result<T, SessionBaseError>;

export class SessionService implements ISessionService {
	private readonly _repository: ISessionRepository;

	constructor(repository: ISessionRepository = new SessionRepository()) {
		this._repository = repository;
	}
}
