import type { InsertSession, SelectSession } from "../types/index.js";

import { Session } from "../models/session.model.js";
import { handleDatabaseError } from "../utils/index.js";

export interface ISessionRepository {
	create(args: InsertSession): Promise<SelectSession>;
}

export class SessionRepository implements ISessionRepository {
	private readonly _db: typeof Session;

	constructor(db?: typeof Session) {
		this._db = db ?? Session;
	}

	public async create(args: InsertSession): Promise<SelectSession> {
		try {
			return (await this._db.create(args)).toObject();
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	private _errorHandler(error: unknown): never {
		return handleDatabaseError(error);
	}
}
