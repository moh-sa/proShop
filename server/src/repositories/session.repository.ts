import type { DatabaseBaseError } from "../errors/index.js";
import { SessionModel } from "../models/session.model.js";
import type {
	CreateSession,
	FailureResult,
	MethodParams,
	MethodReturn,
	Result,
	Session,
} from "../types/index.js";
import {
	handleDatabaseErrorResult,
	serializeMongoResult,
} from "../utils/index.js";

export interface ISessionRepository {
	create(args: CreateSession): Promise<SessionResult<Session>>;
	deleteAllByUserId(args: { userId: string }): Promise<SessionResult<number>>;
	deleteAllByUserIdExcept(args: {
		exceptSessionId: string;
		userId: string;
	}): Promise<SessionResult<number>>;
	deleteById(args: { sessionId: string }): Promise<SessionResult<number>>;
	deleteByIdAndUserId(args: {
		sessionId: string;
		userId: string;
	}): Promise<SessionResult<number>>;
	deleteByTokenHash(args: {
		tokenHash: string;
	}): Promise<SessionResult<number>>;
	getAllByUserId(args: {
		userId: string;
	}): Promise<SessionResult<Array<Session>>>;
	getByTokenHash(args: {
		tokenHash: string;
	}): Promise<SessionResult<null | Session>>;
	/**
	 * Updates activity only if `lastSeenAt` is older than `touchedBefore`,
	 * so concurrent requests write at most once.
	 */
	touch(args: {
		expiresAt: Date;
		lastSeenAt: Date;
		sessionId: string;
		touchedBefore: Date;
	}): Promise<SessionResult<boolean>>;
}

type SessionResult<T> = Result<T, DatabaseBaseError>;

export class SessionRepository implements ISessionRepository {
	private readonly _db: typeof SessionModel;

	constructor(db?: typeof SessionModel) {
		this._db = db ?? SessionModel;
	}

	public async create(
		args: MethodParams<ISessionRepository, "create">,
	): MethodReturn<ISessionRepository, "create"> {
		try {
			const result = await this._db.create(args);

			return {
				data: serializeMongoResult(result.toObject()),
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async deleteAllByUserId(
		args: MethodParams<ISessionRepository, "deleteAllByUserId">,
	): MethodReturn<ISessionRepository, "deleteAllByUserId"> {
		try {
			const result = await this._db.deleteMany({ userId: args.userId });

			return {
				data: result.deletedCount,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async deleteAllByUserIdExcept(
		args: MethodParams<ISessionRepository, "deleteAllByUserIdExcept">,
	): MethodReturn<ISessionRepository, "deleteAllByUserIdExcept"> {
		try {
			const result = await this._db.deleteMany({
				_id: { $ne: args.exceptSessionId },
				userId: args.userId,
			});

			return {
				data: result.deletedCount,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async deleteById(
		args: MethodParams<ISessionRepository, "deleteById">,
	): MethodReturn<ISessionRepository, "deleteById"> {
		try {
			const result = await this._db.deleteOne({ _id: args.sessionId });

			return {
				data: result.deletedCount,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async deleteByIdAndUserId(
		args: MethodParams<ISessionRepository, "deleteByIdAndUserId">,
	): MethodReturn<ISessionRepository, "deleteByIdAndUserId"> {
		try {
			const result = await this._db.deleteOne({
				_id: args.sessionId,
				userId: args.userId,
			});

			return {
				data: result.deletedCount,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async deleteByTokenHash(
		args: MethodParams<ISessionRepository, "deleteByTokenHash">,
	): MethodReturn<ISessionRepository, "deleteByTokenHash"> {
		try {
			const result = await this._db.deleteOne({ tokenHash: args.tokenHash });

			return {
				data: result.deletedCount,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getAllByUserId(
		args: MethodParams<ISessionRepository, "getAllByUserId">,
	): MethodReturn<ISessionRepository, "getAllByUserId"> {
		try {
			const result = await this._db
				.find({ userId: args.userId })
				.sort({ lastSeenAt: -1 })
				.lean();

			return {
				data: result.map((session) => serializeMongoResult(session)),
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getByTokenHash(
		args: MethodParams<ISessionRepository, "getByTokenHash">,
	): MethodReturn<ISessionRepository, "getByTokenHash"> {
		try {
			const result = await this._db
				.findOne({ tokenHash: args.tokenHash })
				.lean();

			return {
				data: serializeMongoResult(result),
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async touch(
		args: MethodParams<ISessionRepository, "touch">,
	): MethodReturn<ISessionRepository, "touch"> {
		try {
			const result = await this._db.updateOne(
				{ _id: args.sessionId, lastSeenAt: { $lt: args.touchedBefore } },
				{ $set: { expiresAt: args.expiresAt, lastSeenAt: args.lastSeenAt } },
			);

			return {
				data: result.modifiedCount === 1,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	private _errorHandler(error: unknown): FailureResult<DatabaseBaseError> {
		return handleDatabaseErrorResult(error);
	}
}

export const sessionRepository = new SessionRepository();
