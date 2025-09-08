/* eslint-disable perfectionist/sort-objects */
import { mock } from "node:test";

import type { IAuthManager } from "../../managers/auth.manager.js";
import type { FunctionMocksWithReset } from "../types/mocked.type.js";

export function mockAuthManager(): FunctionMocksWithReset<IAuthManager> {
	return {
		getUserSessions: mock.fn(),
		refreshAccessToken: mock.fn(),
		revokeSession: mock.fn(),
		signIn: mock.fn(),
		signOut: mock.fn(),
		signOutAll: mock.fn(),
		signUp: mock.fn(),
		reset() {
			this.getUserSessions.mock.resetCalls();
			this.refreshAccessToken.mock.resetCalls();
			this.revokeSession.mock.resetCalls();
			this.signIn.mock.resetCalls();
			this.signOut.mock.resetCalls();
			this.signOutAll.mock.resetCalls();
			this.signUp.mock.resetCalls();

			this.getUserSessions.mock.restore();
			this.refreshAccessToken.mock.restore();
			this.revokeSession.mock.restore();
			this.signIn.mock.restore();
			this.signOut.mock.restore();
			this.signOutAll.mock.restore();
			this.signUp.mock.restore();
		},
	};
}
