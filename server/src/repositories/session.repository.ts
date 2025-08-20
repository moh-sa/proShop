import type { Types } from "mongoose";

import type { InsertSession, SelectSession } from "../types/index.js";

import { Session } from "../models/session.model.js";
import { handleDatabaseError } from "../utils/index.js";

export interface ISessionRepository {
	create(args: InsertSession): Promise<SelectSession>;
	getAll(): Promise<Array<SelectSession>>;
	getByTokenIdAndUserId(args: {
		tokenId: string;
		userId: Types.ObjectId;
	}): Promise<SelectSession>;
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

	public async getAll(): Promise<Array<SelectSession>> {
		try {
			return await this._db.find({}).lean();
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getByTokenIdAndUserId(args: {
		tokenId: string;
		userId: Types.ObjectId;
	}): Promise<SelectSession> {
		try {
			return await this._db
				.findOne({ tokenId: args.tokenId, userId: args.userId })
				.lean();
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	private _errorHandler(error: unknown): never {
		return handleDatabaseError(error);
	}
}
