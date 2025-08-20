import * as argon from "argon2";

export interface IPasswordService {}

export class PasswordService implements IPasswordService {
	private readonly _provider: typeof argon;

	constructor(provider: typeof argon = argon) {
		this._provider = provider;
	}
}
