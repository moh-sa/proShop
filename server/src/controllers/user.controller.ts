import type { IUserService } from "../services/index.js";
import type { AsyncRequestHandler } from "../types/index.js";

import { HTTP_STATUS } from "../constants/index.js";
import { NotFoundError } from "../errors/index.js";
import { insertUserSchema } from "../schemas/index.js";
import { UserService } from "../services/index.js";
import {
	asyncHandler,
	removeEmptyFieldsSchema,
	sendSuccessResponse,
} from "../utils/index.js";
import { objectIdValidator } from "../validators/index.js";

export interface IUserController {
	delete: AsyncRequestHandler<unknown, unknown, { userId: string }>;
	getAll: AsyncRequestHandler;
	getById: AsyncRequestHandler<unknown, unknown, { userId: string }>;
	update: AsyncRequestHandler<unknown, unknown, { userId: string }>;
}

export class UserController implements IUserController {
	private readonly _service: IUserService;

	delete = asyncHandler<unknown, unknown, { userId: string }>(
		async (req, res) => {
			const idReq = req.params.userId;
			const userId = objectIdValidator.parse(idReq);

			const response = await this._service.delete({ userId });
			if (!response) {
				throw new NotFoundError("User");
			}

			return sendSuccessResponse({
				data: null,
				responseContext: res,
				statusCode: HTTP_STATUS.NO_CONTENT,
			});
		},
	);

	getAll = asyncHandler(async (req, res) => {
		const response = await this._service.getAll();

		return sendSuccessResponse({
			data: response,
			responseContext: res,
			statusCode: HTTP_STATUS.OK,
		});
	});

	getById = asyncHandler<unknown, unknown, { userId: string }>(
		async (req, res) => {
			const idReq = req.params?.userId ?? res.locals.user?._id;
			const userId = objectIdValidator.parse(idReq);

			const response = await this._service.getById({ userId });

			return sendSuccessResponse({
				data: response,
				responseContext: res,
				statusCode: HTTP_STATUS.OK,
			});
		},
	);

	update = asyncHandler<unknown, unknown, { userId: string }>(
		async (req, res) => {
			const idReq = req.params?.userId ?? res.locals.user?._id;
			const userId = objectIdValidator.parse(idReq);

			const data = removeEmptyFieldsSchema(insertUserSchema.partial()).parse(
				req.body,
			);

			const response = await this._service.updateById({
				data,
				userId,
			});

			return sendSuccessResponse({
				data: response,
				responseContext: res,
				statusCode: HTTP_STATUS.OK,
			});
		},
	);

	constructor(service: IUserService = new UserService()) {
		this._service = service;
	}
}
