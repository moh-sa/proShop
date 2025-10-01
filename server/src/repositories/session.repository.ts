import type {
	InsertSession,
	MethodParams,
	MethodReturn,
	SelectSession,
} from "../types/index.js";

import { Session } from "../models/session.model.js";
import { handleDatabaseError } from "../utils/index.js";

export interface ISessionRepository {
	countActiveByUserId(args: { userId: string }): Promise<number>;
	create(args: InsertSession): Promise<SelectSession>;
	deleteAllByUserId(args: { userId: string }): Promise<number>;
	deleteByTokenIdAndUserId(args: {
		tokenId: string;
		userId: string;
	}): Promise<null | SelectSession>;
	existsByTokenIdAndUserId(args: {
		tokenId: string;
		userId: string;
	}): Promise<null | string>;
	getAll(): Promise<Array<SelectSession>>;
	getAllActiveByUserId(args: { userId: string }): Promise<Array<SelectSession>>;
	getAllByUserId(args: { userId: string }): Promise<Array<SelectSession>>;
	getAllRevoked(): Promise<Array<SelectSession>>;
	getAllRevokedByUserId(args: {
		userId: string;
	}): Promise<Array<SelectSession>>;
	getByTokenIdAndUserId(args: {
		tokenId: string;
		userId: string;
	}): Promise<null | SelectSession>;
	revokeAllByUserId(args: { userId: string }): Promise<number>;
	revokeByTokenIdAndUserId(args: {
		tokenId: string;
		userId: string;
	}): Promise<null | SelectSession>;
	updateByTokenIdAndUserId(args: {
		data: Partial<InsertSession>;
		tokenId: string;
		userId: string;
	}): Promise<null | SelectSession>;
}

export class SessionRepository implements ISessionRepository {
	private readonly _db: typeof Session;

	constructor(db?: typeof Session) {
		this._db = db ?? Session;
	}

	public async countActiveByUserId(
		args: MethodParams<ISessionRepository, "countActiveByUserId">,
	): MethodReturn<ISessionRepository, "countActiveByUserId"> {
		try {
			return await this._db.countDocuments({
				expiresAt: { $gt: new Date() },
				revokedAt: null,
				userId: args.userId,
			});
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async create(
		args: MethodParams<ISessionRepository, "create">,
	): MethodReturn<ISessionRepository, "create"> {
		try {
			return (await this._db.create(args)).toObject();
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async deleteAllByUserId(
		args: MethodParams<ISessionRepository, "deleteAllByUserId">,
	): MethodReturn<ISessionRepository, "deleteAllByUserId"> {
		try {
			return (await this._db.deleteMany({ userId: args.userId }).lean())
				.deletedCount;
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async deleteByTokenIdAndUserId(
		args: MethodParams<ISessionRepository, "deleteByTokenIdAndUserId">,
	): MethodReturn<ISessionRepository, "deleteByTokenIdAndUserId"> {
		try {
			return await this._db
				.findOneAndDelete({ tokenId: args.tokenId, userId: args.userId })
				.lean();
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async existsByTokenIdAndUserId(
		args: MethodParams<ISessionRepository, "existsByTokenIdAndUserId">,
	): MethodReturn<ISessionRepository, "existsByTokenIdAndUserId"> {
		try {
			return await this._db
				.exists({ tokenId: args.tokenId, userId: args.userId })
				.lean();
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getAll(): MethodReturn<ISessionRepository, "getAll"> {
		try {
			return await this._db.find({}).lean();
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getAllActiveByUserId(
		args: MethodParams<ISessionRepository, "getAllActiveByUserId">,
	): MethodReturn<ISessionRepository, "getAllActiveByUserId"> {
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

	public async getAllByUserId(
		args: MethodParams<ISessionRepository, "getAllByUserId">,
	): MethodReturn<ISessionRepository, "getAllByUserId"> {
		try {
			return await this._db.find({ userId: args.userId }).lean();
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getAllRevoked(): MethodReturn<
		ISessionRepository,
		"getAllRevoked"
	> {
		try {
			return await this._db.find({ revokedAt: { $ne: null } }).lean();
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getAllRevokedByUserId(
		args: MethodParams<ISessionRepository, "getAllRevokedByUserId">,
	): MethodReturn<ISessionRepository, "getAllRevokedByUserId"> {
		try {
			return await this._db
				.find({ revokedAt: { $ne: null }, userId: args.userId })
				.lean();
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getByTokenIdAndUserId(
		args: MethodParams<ISessionRepository, "getByTokenIdAndUserId">,
	): MethodReturn<ISessionRepository, "getByTokenIdAndUserId"> {
		try {
			return await this._db
				.findOne({ tokenId: args.tokenId, userId: args.userId })
				.lean();
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async revokeAllByUserId(
		args: MethodParams<ISessionRepository, "revokeAllByUserId">,
	): MethodReturn<ISessionRepository, "revokeAllByUserId"> {
		try {
			return (
				await this._db
					.updateMany({ userId: args.userId }, { revokedAt: new Date() })
					.lean()
			).modifiedCount;
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async revokeByTokenIdAndUserId(
		args: MethodParams<ISessionRepository, "revokeByTokenIdAndUserId">,
	): MethodReturn<ISessionRepository, "revokeByTokenIdAndUserId"> {
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

	public async updateByTokenIdAndUserId(
		args: MethodParams<ISessionRepository, "updateByTokenIdAndUserId">,
	): MethodReturn<ISessionRepository, "updateByTokenIdAndUserId"> {
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
