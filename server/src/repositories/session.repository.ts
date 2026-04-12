import { Types } from "mongoose";

import type { DatabaseBaseError } from "../errors/index.js";
import type {
	CreateSession,
	FailureResult,
	GetAllSessionsByUserIdRepositoryParams,
	GetAllSessionsRepositoryParams,
	MethodParams,
	MethodReturn,
	PaginatedResponse,
	PaginationQuery,
	Result,
	Session,
	SessionFilter,
	SessionSchema,
} from "../types/index.js";

import { SessionModel } from "../models/session.model.js";
import { handleDatabaseErrorResult, Paginator } from "../utils/index.js";

export interface ISessionRepository {
	countActiveByUserId(args: {
		userId: Types.ObjectId;
	}): Promise<SessionResult<number>>;
	create(args: CreateSession): Promise<SessionResult<Session>>;
	deleteAllByUserId(args: {
		userId: Types.ObjectId;
	}): Promise<SessionResult<number>>;
	deleteByTokenIdAndUserId(args: {
		tokenId: string;
		userId: Types.ObjectId;
	}): Promise<SessionResult<null | Session>>;
	existsByTokenIdAndUserId(args: {
		tokenId: string;
		userId: Types.ObjectId;
	}): Promise<SessionResult<null | { _id: Types.ObjectId }>>;
	getAll(
		args: GetAllSessionsRepositoryParams,
	): Promise<SessionResult<PaginatedResponse<Session>>>;
	getAllActiveByUserId(
		args: GetAllSessionsByUserIdRepositoryParams,
	): Promise<SessionResult<PaginatedResponse<Session>>>;
	getAllByUserId(
		args: GetAllSessionsByUserIdRepositoryParams,
	): Promise<SessionResult<PaginatedResponse<Session>>>;
	getAllRevoked(
		args: GetAllSessionsRepositoryParams,
	): Promise<SessionResult<PaginatedResponse<Session>>>;
	getAllRevokedByUserId(
		args: GetAllSessionsByUserIdRepositoryParams,
	): Promise<SessionResult<PaginatedResponse<Session>>>;
	getByTokenIdAndUserId(args: {
		tokenId: string;
		userId: Types.ObjectId;
	}): Promise<SessionResult<null | Session>>;
	revokeAllByUserId(args: {
		userId: Types.ObjectId;
	}): Promise<SessionResult<number>>;
	revokeByTokenIdAndUserId(args: {
		tokenId: string;
		userId: Types.ObjectId;
	}): Promise<SessionResult<null | Session>>;
	updateByTokenIdAndUserId(args: {
		data: Partial<CreateSession>;
		tokenId: string;
		userId: Types.ObjectId;
	}): Promise<SessionResult<null | Session>>;
}

type SessionResult<T> = Result<T, DatabaseBaseError>;

export class SessionRepository implements ISessionRepository {
	private readonly _db: typeof SessionModel;
	private _paginator: Paginator<SessionSchema, Session>;

	constructor(db?: typeof SessionModel) {
		this._db = db ?? SessionModel;
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
				query: args.filters && this._prepareFilters(args.filters),
				select: args.select,
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
			const parsedUserId = new Types.ObjectId(args.userId);

			const result = await this._paginator.paginate({
				pageNumber: args.pageNumber,
				pageSize: args.pageSize,
				query: {
					...(args.filters && this._prepareFilters(args.filters)),
					expiresAt: { $gt: new Date() },
					revokedAt: null,
					userId: parsedUserId,
				},
				select: args.select,
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
			const parsedUserId = new Types.ObjectId(args.userId);

			const result = await this._paginator.paginate({
				pageNumber: args.pageNumber,
				pageSize: args.pageSize,
				query: {
					...(args.filters && this._prepareFilters(args.filters)),
					userId: parsedUserId,
				},
				select: args.select,
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
					...(args.filters ? this._prepareFilters(args.filters) : undefined),
					revokedAt: { $ne: null },
				},
				select: args.select,
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
			const parsedUserId = new Types.ObjectId(args.userId);

			const result = await this._paginator.paginate({
				pageNumber: args.pageNumber,
				pageSize: args.pageSize,
				query: {
					...(args.filters ? this._prepareFilters(args.filters) : undefined),
					revokedAt: { $ne: null },
					userId: parsedUserId,
				},
				select: args.select,
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
					{ returnDocument: "after" },
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

	private _prepareFilters(
		filters?: SessionFilter,
	): Partial<PaginationQuery<Session>> {
		if (!filters) {
			return {};
		}

		const newFilter: Partial<PaginationQuery<Session>> = {};

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
