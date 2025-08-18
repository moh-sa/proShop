import { Session } from "../models/session.model.js";

export interface ISessionRepository {}

export class SessionRepository implements ISessionRepository {
	private readonly _db: typeof Session;

	constructor(db?: typeof Session) {
		this._db = db ?? Session;
	}
}
