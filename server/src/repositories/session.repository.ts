import type { FailureResult } from "../types/index.js";

import { Session } from "../models/session.model.js";
import { handleDatabaseError } from "../utils/index.js";

export interface ISessionRepository {}

export class SessionRepository implements ISessionRepository {
	private readonly _db: typeof Session;

	constructor(db?: typeof Session) {
		this._db = db ?? Session;
	}

	private _errorHandler(error: unknown): FailureResult {
		return handleDatabaseError(error);
	}
}
