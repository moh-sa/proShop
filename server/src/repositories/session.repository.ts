import type { Types } from "mongoose";

import type { DatabaseBaseError } from "../errors/index.js";
import type {
	FailureResult,
	InsertSession,
	MethodParams,
	MethodReturn,
	PaginatedResponse,
	PaginationParamsQuery,
	Result,
	SelectSession,
} from "../types/index.js";

import { Session } from "../models/session.model.js";
import { handleDatabaseErrorResult, Paginator } from "../utils/index.js";

export interface ISessionRepository {
	countActiveByUserId(args: { userId: string }): Promise<SessionResult<number>>;
	create(args: InsertSession): Promise<SessionResult<SelectSession>>;
	deleteAllByUserId(args: { userId: string }): Promise<SessionResult<number>>;
	deleteByTokenIdAndUserId(args: {
		tokenId: string;
		userId: string;
	}): Promise<SessionResult<null | SelectSession>>;
	existsByTokenIdAndUserId(args: {
		tokenId: string;
		userId: string;
	}): Promise<SessionResult<null | { _id: Types.ObjectId }>>;
	getAll(
		args: PaginationParamsQuery<SelectSession>,
	): Promise<SessionResult<PaginatedResponse<SelectSession>>>;
	getAllActiveByUserId(
		args: PaginationParamsQuery<SelectSession> & {
			userId: string;
		},
	): Promise<SessionResult<PaginatedResponse<SelectSession>>>;
	getAllByUserId(
		args: PaginationParamsQuery<SelectSession> & {
			userId: string;
		},
	): Promise<SessionResult<PaginatedResponse<SelectSession>>>;
	getAllRevoked(
		args: PaginationParamsQuery<SelectSession>,
	): Promise<SessionResult<PaginatedResponse<SelectSession>>>;
	getAllRevokedByUserId(
		args: PaginationParamsQuery<SelectSession> & {
			userId: string;
		},
	): Promise<SessionResult<PaginatedResponse<SelectSession>>>;
	getByTokenIdAndUserId(args: {
		tokenId: string;
		userId: string;
	}): Promise<SessionResult<null | SelectSession>>;
	revokeAllByUserId(args: { userId: string }): Promise<SessionResult<number>>;
	revokeByTokenIdAndUserId(args: {
		tokenId: string;
		userId: string;
	}): Promise<SessionResult<null | SelectSession>>;
	updateByTokenIdAndUserId(args: {
		data: Partial<InsertSession>;
		tokenId: string;
		userId: string;
	}): Promise<SessionResult<null | SelectSession>>;
}

type SessionResult<T> = Result<T, DatabaseBaseError>;

export class SessionRepository implements ISessionRepository {
	private readonly _db: typeof Session;
	private _paginator: Paginator<SelectSession>;

	constructor(db: typeof Session = Session) {
		this._db = db;
		this._paginator = new Paginator(this._db);
	}

	public async countActiveByUserId(
		args: MethodParams<ISessionRepository, "countActiveByUserId">,
	): MethodReturn<ISessionRepository, "countActiveByUserId"> {
		try {
			const result = await this._db.countDocuments({
				expiresAt: { $gt: new Date() },
				revokedAt: null,
				userId: args.userId,
			});

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async create(
		args: MethodParams<ISessionRepository, "create">,
	): MethodReturn<ISessionRepository, "create"> {
		try {
			const result = await this._db.create(args);

			return {
				data: result.toObject(),
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
			const result = await this._db.deleteMany({ userId: args.userId }).lean();

			return {
				data: result.deletedCount,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async deleteByTokenIdAndUserId(
		args: MethodParams<ISessionRepository, "deleteByTokenIdAndUserId">,
	): MethodReturn<ISessionRepository, "deleteByTokenIdAndUserId"> {
		try {
			const result = await this._db
				.findOneAndDelete({ tokenId: args.tokenId, userId: args.userId })
				.lean();

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async existsByTokenIdAndUserId(
		args: MethodParams<ISessionRepository, "existsByTokenIdAndUserId">,
	): MethodReturn<ISessionRepository, "existsByTokenIdAndUserId"> {
		try {
			const result = await this._db
				.exists({ tokenId: args.tokenId, userId: args.userId })
				.lean();

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getAll(
		args: MethodParams<ISessionRepository, "getAll">,
	): MethodReturn<ISessionRepository, "getAll"> {
		try {
			const result = await this._paginator.paginate({
				pageNumber: args.pageNumber,
				pageSize: args.pageSize,
				query: args.query,
				sort: args.sort,
			});

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getAllActiveByUserId(
		args: MethodParams<ISessionRepository, "getAllActiveByUserId">,
	): MethodReturn<ISessionRepository, "getAllActiveByUserId"> {
		try {
			const result = await this._paginator.paginate({
				pageNumber: args.pageNumber,
				pageSize: args.pageSize,
				query: {
					expiresAt: { $gt: new Date() },
					revokedAt: null,
					userId: args.userId,
				},
				sort: args.sort,
			});

			return {
				data: result,
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
			const result = await this._paginator.paginate({
				pageNumber: args.pageNumber,
				pageSize: args.pageSize,
				query: {
					userId: args.userId,
				},
				sort: args.sort,
			});

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getAllRevoked(
		args: MethodParams<ISessionRepository, "getAllRevoked">,
	): MethodReturn<ISessionRepository, "getAllRevoked"> {
		try {
			const result = await this._paginator.paginate({
				pageNumber: args.pageNumber,
				pageSize: args.pageSize,
				query: {
					revokedAt: { $ne: null },
				},
				sort: args.sort,
			});

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getAllRevokedByUserId(
		args: MethodParams<ISessionRepository, "getAllRevokedByUserId">,
	): MethodReturn<ISessionRepository, "getAllRevokedByUserId"> {
		try {
			const result = await this._paginator.paginate({
				pageNumber: args.pageNumber,
				pageSize: args.pageSize,
				query: {
					revokedAt: { $ne: null },
					userId: args.userId,
				},
				sort: args.sort,
			});

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async getByTokenIdAndUserId(
		args: MethodParams<ISessionRepository, "getByTokenIdAndUserId">,
	): MethodReturn<ISessionRepository, "getByTokenIdAndUserId"> {
		try {
			const result = await this._db
				.findOne({ tokenId: args.tokenId, userId: args.userId })
				.lean();

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async revokeAllByUserId(
		args: MethodParams<ISessionRepository, "revokeAllByUserId">,
	): MethodReturn<ISessionRepository, "revokeAllByUserId"> {
		try {
			const result = await this._db
				.updateMany({ userId: args.userId }, { revokedAt: new Date() })
				.lean();

			return {
				data: result.modifiedCount,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async revokeByTokenIdAndUserId(
		args: MethodParams<ISessionRepository, "revokeByTokenIdAndUserId">,
	): MethodReturn<ISessionRepository, "revokeByTokenIdAndUserId"> {
		try {
			const result = await this._db
				.findOneAndUpdate(
					{ tokenId: args.tokenId, userId: args.userId },
					{ revokedAt: new Date() },
				)
				.lean();

			return {
				data: result,
				success: true,
			};
		} catch (error) {
			return this._errorHandler(error);
		}
	}

	public async updateByTokenIdAndUserId(
		args: MethodParams<ISessionRepository, "updateByTokenIdAndUserId">,
	): MethodReturn<ISessionRepository, "updateByTokenIdAndUserId"> {
		try {
			const result = await this._db
				.findOneAndUpdate(
					{ tokenId: args.tokenId, userId: args.userId },
					args.data,
					{ new: true },
				)
				.lean();

			return {
				data: result,
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
