import { Types } from "mongoose";

import type { DatabaseBaseError } from "../errors/index.js";
import type {
	FailureResult,
	GetAllSessionsByUserIdRepositoryParams,
	GetAllSessionsRepositoryParams,
	InsertSession,
	MethodParams,
	MethodReturn,
	PaginatedResponse,
	PaginationQuery,
	Result,
	SelectSession,
	SessionFilter,
} from "../types/index.js";
import type { PaginatorParams } from "../utils/index.js";

import { Session } from "../models/session.model.js";
import {
	buildMongoSelectProjection,
	handleDatabaseErrorResult,
	Paginator,
} from "../utils/index.js";

export interface ISessionRepository {
	countActiveByUserId(args: {
		userId: Types.ObjectId;
	}): Promise<SessionResult<number>>;
	create(args: InsertSession): Promise<SessionResult<SelectSession>>;
	deleteAllByUserId(args: {
		userId: Types.ObjectId;
	}): Promise<SessionResult<number>>;
	deleteByTokenIdAndUserId(args: {
		tokenId: string;
		userId: Types.ObjectId;
	}): Promise<SessionResult<null | SelectSession>>;
	existsByTokenIdAndUserId(args: {
		tokenId: string;
		userId: Types.ObjectId;
	}): Promise<SessionResult<null | { _id: Types.ObjectId }>>;
	getAll(
		args: GetAllSessionsRepositoryParams,
	): Promise<SessionResult<PaginatedResponse<SelectSession>>>;
	getAllActiveByUserId(
		args: GetAllSessionsByUserIdRepositoryParams,
	): Promise<SessionResult<PaginatedResponse<SelectSession>>>;
	getAllByUserId(
		args: GetAllSessionsByUserIdRepositoryParams,
	): Promise<SessionResult<PaginatedResponse<SelectSession>>>;
	getAllRevoked(
		args: GetAllSessionsRepositoryParams,
	): Promise<SessionResult<PaginatedResponse<SelectSession>>>;
	getAllRevokedByUserId(
		args: GetAllSessionsByUserIdRepositoryParams,
	): Promise<SessionResult<PaginatedResponse<SelectSession>>>;
	getByTokenIdAndUserId(args: {
		tokenId: string;
		userId: Types.ObjectId;
	}): Promise<SessionResult<null | SelectSession>>;
	revokeAllByUserId(args: {
		userId: Types.ObjectId;
	}): Promise<SessionResult<number>>;
	revokeByTokenIdAndUserId(args: {
		tokenId: string;
		userId: Types.ObjectId;
	}): Promise<SessionResult<null | SelectSession>>;
	updateByTokenIdAndUserId(args: {
		data: Partial<InsertSession>;
		tokenId: string;
		userId: Types.ObjectId;
	}): Promise<SessionResult<null | SelectSession>>;
}

type SessionResult<T> = Result<T, DatabaseBaseError>;

export class SessionRepository implements ISessionRepository {
	private readonly _db: typeof Session;
	private _paginator: Paginator<SelectSession>;

	constructor(db?: typeof Session) {
		this._db = db ?? Session;
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
			const result = await this._paginateSessions(args);

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
			const parsedUserId = new Types.ObjectId(args.userId);

			const result = await this._paginateSessions(args, {
				expiresAt: { $gt: new Date() },
				revokedAt: null,
				userId: parsedUserId,
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
			const parsedUserId = new Types.ObjectId(args.userId);

			const result = await this._paginateSessions(args, {
				userId: parsedUserId,
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
			const result = await this._paginateSessions(args, {
				revokedAt: { $ne: null },
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
			const parsedUserId = new Types.ObjectId(args.userId);

			const result = await this._paginateSessions(args, {
				revokedAt: { $ne: null },
				userId: parsedUserId,
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

	private async _paginateSessions(
		args: GetAllSessionsRepositoryParams,
		query?: Partial<PaginationQuery<SelectSession>>,
	): Promise<PaginatedResponse<SelectSession>> {
		const paginateOptions: PaginatorParams<SelectSession> = {
			pageNumber: args.pageNumber,
			pageSize: args.pageSize,
		};

		if (args.filters) {
			const filters = this._prepareFilters(args.filters);
			paginateOptions.query = { ...filters };
		}

		if (query) {
			paginateOptions.query = { ...paginateOptions.query, ...query };
		}

		if (args.select) {
			const select = buildMongoSelectProjection(args.select);
			paginateOptions.pipeline = [{ $project: select }];
		}

		if (args.sort) {
			paginateOptions.sort = args.sort;
		}

		return this._paginator.paginate<SelectSession>(paginateOptions);
	}

	private _prepareFilters(
		filters?: SessionFilter,
	): Partial<PaginationQuery<SelectSession>> {
		if (!filters) {
			return {};
		}

		const newFilter: Partial<PaginationQuery<SelectSession>> = {};

		if (filters.tokenId !== undefined) {
			newFilter.tokenId = filters.tokenId;
		}

		if (filters.userId !== undefined) {
			newFilter.userId = filters.userId;
		}

		if (filters.revokedAt !== undefined) {
			newFilter.revokedAt = filters.revokedAt;
		}

		return newFilter;
	}
}

export const sessionRepository = new SessionRepository();
