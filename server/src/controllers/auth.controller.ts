import type { IAuthService } from "../services/index.js";
import type {
	AsyncHandler,
	InsertUser,
	SafeSelectUser,
} from "../types/index.js";

import { HTTP_STATUS } from "../constants/index.js";
import { insertUserSchema, selectUserSchema } from "../schemas/index.js";
import { AuthService } from "../services/index.js";
import { asyncHandler } from "../utils/index.js";

export interface IAuthController {
	signin: AsyncHandler<{
		reqBody: Pick<InsertUser, "email" | "password">;
		resBody: { data: SafeSelectUser };
	}>;
	signup: AsyncHandler<{
		reqBody: InsertUser;
		resBody: { data: SafeSelectUser };
	}>;
}
export class AuthController implements IAuthController {
	private readonly _service: IAuthService;

	signin = asyncHandler<{
		reqBody: Pick<InsertUser, "email" | "password">;
		resBody: { data: SafeSelectUser };
	}>(async (req, res) => {
		const data = res.locals.user || req.body;

		const parsedData = selectUserSchema
			.pick({ email: true, password: true })
			.parse(data);

		const response = await this._service.signin(parsedData);

		res.status(HTTP_STATUS.OK).json({
			data: response,
			success: true,
		});
	});

	signup = asyncHandler<{
		reqBody: InsertUser;
		resBody: { data: SafeSelectUser };
	}>(async (req, res) => {
		const data = insertUserSchema.parse(req.body);

		const response = await this._service.signup(data);

		res.status(HTTP_STATUS.CREATED).json({
			data: response,
			success: true,
		});
	});

	constructor(service: IAuthService = new AuthService()) {
		this._service = service;
	}
}
