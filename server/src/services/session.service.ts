import { createHash, randomBytes } from "node:crypto";

import {
	MAX_USER_AGENT_LENGTH,
	SESSION_ABSOLUTE_TIMEOUT_MS,
	SESSION_IDLE_TIMEOUT_MS,
	SESSION_TOKEN_BYTES,
	SESSION_TOUCH_INTERVAL_MS,
} from "../constants/index.js";
import { AuthenticationError } from "../errors/index.js";
import type { ISessionRepository } from "../repositories/index.js";
import { sessionRepository } from "../repositories/index.js";
import type {
	MethodParams,
	MethodReturn,
	Result,
	Session,
} from "../types/index.js";
import { getLoggerFromContext } from "../utils/index.js";

export interface ISessionService {
	/**
	 * Returns the raw token exactly once - only its hash is stored.
	 */
	create(args: {
		userAgent: string;
		userId: string;
	}): Promise<Result<{ session: Session; token: string }>>;
	deleteAllByUserId(args: { userId: string }): Promise<Result<number>>;
	deleteAllByUserIdExcept(args: {
		exceptSessionId: string;
		userId: string;
	}): Promise<Result<number>>;
	deleteById(args: { sessionId: string }): Promise<Result<number>>;
	deleteByToken(args: { token: string }): Promise<Result<number>>;
	getAllByUserId(args: { userId: string }): Promise<Result<Array<Session>>>;
	/**
	 * Resolves a token to a live session, enforcing idle and absolute
	 * timeouts, and records activity at most once per touch interval.
	 */
	validate(args: { token: string }): Promise<Result<Session>>;
}

const INVALID_SESSION_MESSAGE =
	"Session expired or invalid. Please sign in again.";

export class SessionService implements ISessionService {
	private readonly _repository: ISessionRepository;

	constructor(repository?: ISessionRepository) {
		this._repository = repository ?? sessionRepository;
	}

	public async create(
		args: MethodParams<ISessionService, "create">,
	): MethodReturn<ISessionService, "create"> {
		const logger = this._getLogger({ method: "create" });

		const token = randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
		const now = new Date();

		const createResult = await this._repository.create({
			expiresAt: new Date(now.getTime() + SESSION_IDLE_TIMEOUT_MS),
			lastSeenAt: now,
			tokenHash: this._hashToken(token),
			userAgent: args.userAgent.slice(0, MAX_USER_AGENT_LENGTH),
			userId: args.userId,
		});
		if (!createResult.success) {
			logger.error(
				{ error: createResult.error, userId: args.userId },
				"Failed to create session",
			);
			return createResult;
		}

		logger.info(
			{ sessionId: createResult.data.id, userId: args.userId },
			"Session created",
		);
		return {
			data: { session: createResult.data, token },
			success: true,
		};
	}

	public async deleteAllByUserId(
		args: MethodParams<ISessionService, "deleteAllByUserId">,
	): MethodReturn<ISessionService, "deleteAllByUserId"> {
		return this._repository.deleteAllByUserId(args);
	}

	public async deleteAllByUserIdExcept(
		args: MethodParams<ISessionService, "deleteAllByUserIdExcept">,
	): MethodReturn<ISessionService, "deleteAllByUserIdExcept"> {
		return this._repository.deleteAllByUserIdExcept(args);
	}

	public async deleteById(
		args: MethodParams<ISessionService, "deleteById">,
	): MethodReturn<ISessionService, "deleteById"> {
		return this._repository.deleteById(args);
	}

	public async deleteByToken(
		args: MethodParams<ISessionService, "deleteByToken">,
	): MethodReturn<ISessionService, "deleteByToken"> {
		return this._repository.deleteByTokenHash({
			tokenHash: this._hashToken(args.token),
		});
	}

	public async getAllByUserId(
		args: MethodParams<ISessionService, "getAllByUserId">,
	): MethodReturn<ISessionService, "getAllByUserId"> {
		return this._repository.getAllByUserId(args);
	}

	public async validate(
		args: MethodParams<ISessionService, "validate">,
	): MethodReturn<ISessionService, "validate"> {
		const logger = this._getLogger({ method: "validate" });

		if (!args.token) {
			return this._invalidSession();
		}

		const sessionResult = await this._repository.getByTokenHash({
			tokenHash: this._hashToken(args.token),
		});
		if (!sessionResult.success) {
			return sessionResult;
		}
		const session = sessionResult.data;
		if (!session) {
			return this._invalidSession();
		}

		const now = Date.now();
		const absoluteExpiresAt =
			session.createdAt.getTime() + SESSION_ABSOLUTE_TIMEOUT_MS;
		const idleExpiresAt =
			session.lastSeenAt.getTime() + SESSION_IDLE_TIMEOUT_MS;
		if (now >= Math.min(absoluteExpiresAt, idleExpiresAt)) {
			// the TTL index would remove it within a minute; don't wait
			await this._repository.deleteById({ sessionId: session.id });
			logger.info({ sessionId: session.id }, "Session expired");
			return this._invalidSession();
		}

		if (now - session.lastSeenAt.getTime() < SESSION_TOUCH_INTERVAL_MS) {
			return { data: session, success: true };
		}

		const lastSeenAt = new Date(now);
		const expiresAt = new Date(
			Math.min(now + SESSION_IDLE_TIMEOUT_MS, absoluteExpiresAt),
		);
		const touchResult = await this._repository.touch({
			expiresAt,
			lastSeenAt,
			sessionId: session.id,
			touchedBefore: new Date(now - SESSION_TOUCH_INTERVAL_MS),
		});
		if (!touchResult.success) {
			return touchResult;
		}

		return {
			data: { ...session, expiresAt, lastSeenAt },
			success: true,
		};
	}

	private _getLogger(args: { [key: string]: unknown; method: string }) {
		return getLoggerFromContext().child({ layer: "session service", ...args });
	}

	private _hashToken(token: string): string {
		// SHA-256 is enough: the token is 256 random bits, so there is nothing to brute-force
		return createHash("sha256").update(token).digest("hex");
	}

	private _invalidSession(): Result<never> {
		return {
			error: new AuthenticationError(INVALID_SESSION_MESSAGE),
			success: false,
		};
	}
}

export const sessionService = new SessionService();
