import type { ISessionRepository } from "../repositories/index.js";
import type { IJwtService } from "./jwt.service.js";

import { SessionRepository } from "../repositories/index.js";
import { JwtService } from "./jwt.service.js";

export interface ISessionService {}

export class SessionService implements ISessionService {
	private readonly _jwtService: IJwtService;
	private readonly _repository: ISessionRepository;

	constructor(
		repository: ISessionRepository = new SessionRepository(),
		jwtService: IJwtService = new JwtService(),
	) {
		this._repository = repository;
		this._jwtService = jwtService;
	}
}
