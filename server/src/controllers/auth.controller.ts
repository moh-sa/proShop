import type { IAuthService } from "../services/index.js";
import type {
	InsertUser,
	SafeSelectUser,
	StrictAsyncHandler,
} from "../types/index.js";

import { HTTP_STATUS } from "../constants/index.js";
import { insertUserSchema, selectUserSchema } from "../schemas/index.js";
import { AuthService } from "../services/index.js";
import { sendSuccessResponse, strictAsyncHandler } from "../utils/index.js";

export interface IAuthController {
	signin: StrictAsyncHandler<{
		reqBody: Pick<InsertUser, "email" | "password">;
		resBody: { data: SafeSelectUser };
	}>;
	signup: StrictAsyncHandler<{
		reqBody: InsertUser;
		resBody: { data: SafeSelectUser };
	}>;
}
export class AuthController implements IAuthController {
	private readonly _service: IAuthService;

	signin = strictAsyncHandler<{
		reqBody: Pick<InsertUser, "email" | "password">;
		resBody: { data: SafeSelectUser };
	}>(async (req, res) => {
		const data = res.locals.user || req.body;

		const parsedData = selectUserSchema
			.pick({ email: true, password: true })
			.parse(data);

		const response = await this._service.signin(parsedData);

		return sendSuccessResponse({
			data: response,
			responseContext: res,
			statusCode: HTTP_STATUS.OK,
		});
	});

	signup = strictAsyncHandler<{
		reqBody: InsertUser;
		resBody: { data: SafeSelectUser };
	}>(async (req, res) => {
		const data = insertUserSchema.parse(req.body);

		const response = await this._service.signup(data);

		return sendSuccessResponse({
			data: response,
			responseContext: res,
			statusCode: HTTP_STATUS.CREATED,
		});
	});

	constructor(service: IAuthService = new AuthService()) {
		this._service = service;
	}
}
