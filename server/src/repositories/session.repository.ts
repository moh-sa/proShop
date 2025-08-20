import type { Types } from "mongoose";

import type { InsertSession, SelectSession } from "../types/index.js";

import { Session } from "../models/session.model.js";
import { handleDatabaseError } from "../utils/index.js";

export interface ISessionRepository {
	create(args: InsertSession): Promise<SelectSession>;
	deleteAllByUserId(args: { userId: Types.ObjectId }): Promise<number>;
	deleteByTokenIdAndUserId(args: {
		tokenId: string;
		userId: Types.ObjectId;
	}): Promise<SelectSession>;
	getAll(): Promise<Array<SelectSession>>;
	getAllActiveByUserId(args: {
		userId: Types.ObjectId;
	}): Promise<Array<SelectSession>>;
	getAllByUserId(args: {
		userId: Types.ObjectId;
	}): Promise<Array<SelectSession>>;
	getAllRevoked(): Promise<Array<SelectSession>>;
	getAllRevokedByUserId(args: {
		userId: Types.ObjectId;
	}): Promise<Array<SelectSession>>;
	getByTokenIdAndUserId(args: {
		tokenId: string;
		userId: Types.ObjectId;
	}): Promise<SelectSession>;
	revokeAllByUserId(args: { userId: Types.ObjectId }): Promise<number>;
	revokeByTokenIdAndUserId(args: {
		tokenId: string;
		userId: Types.ObjectId;
	}): Promise<SelectSession>;
	updateByTokenIdAndUserId(args: {
		data: Partial<InsertSession>;
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

	public async deleteAllByUserId(args: {
		userId: Types.ObjectId;
	}): Promise<number> {
		try {
			return await this._db.deleteMany({ userId: args.userId }).lean();
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async deleteByTokenIdAndUserId(args: {
		tokenId: string;
		userId: Types.ObjectId;
	}): Promise<SelectSession> {
		try {
			return await this._db
				.findOneAndDelete({ tokenId: args.tokenId, userId: args.userId })
				.lean();
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

	public async getAllActiveByUserId(args: {
		userId: Types.ObjectId;
	}): Promise<Array<SelectSession>> {
		try {
			return await this._db
				.find({
					expiresAt: { $gt: new Date() },
					revokedAt: null,
					userId: args.userId,
				})
				.lean();
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getAllByUserId(args: {
		userId: Types.ObjectId;
	}): Promise<Array<SelectSession>> {
		try {
			return await this._db.find({ userId: args.userId }).lean();
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getAllRevoked(): Promise<Array<SelectSession>> {
		try {
			return await this._db.find({ revokedAt: { $ne: null } }).lean();
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getAllRevokedByUserId(args: {
		userId: Types.ObjectId;
	}): Promise<Array<SelectSession>> {
		try {
			return await this._db.find({ userId: args.userId }).lean();
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

	public async revokeAllByUserId(args: {
		userId: Types.ObjectId;
	}): Promise<number> {
		try {
			return await this._db
				.updateMany({ userId: args.userId }, { revokedAt: new Date() })
				.lean();
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async revokeByTokenIdAndUserId(args: {
		tokenId: string;
		userId: Types.ObjectId;
	}): Promise<SelectSession> {
		try {
			return await this._db
				.findOneAndUpdate(
					{ tokenId: args.tokenId, userId: args.userId },
					{ revokedAt: new Date() },
				)
				.lean();
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async updateByTokenIdAndUserId(args: {
		data: Partial<InsertSession>;
		tokenId: string;
		userId: Types.ObjectId;
	}): Promise<SelectSession> {
		try {
			return await this._db
				.findOneAndUpdate(
					{ tokenId: args.tokenId, userId: args.userId },
					args.data,
					{ new: true },
				)
				.lean();
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	private _errorHandler(error: unknown): never {
		return handleDatabaseError(error);
	}
}
