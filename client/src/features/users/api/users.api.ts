import {
	paginationParamsSchema,
	type PaginationParams,
} from "@/features/pagination";
import {
	buildSearchParams,
	ClientApiError,
	del,
	get,
	getPaginated,
	normalizeError,
	patch,
	type ApiPaginatedResponse,
} from "@/shared/api";
import { idSchema } from "@/shared/schemas";
import { updateUserSchema, userSchema } from "../schemas";
import type { UpdateUser, User } from "../types";

export async function getAdminUsersApi(
	params: PaginationParams,
	signal: AbortSignal,
): Promise<ApiPaginatedResponse<User>> {
	const parsedParams = paginationParamsSchema
		.transform(buildSearchParams)
		.safeParse(params);
	if (!parsedParams.success) {
		throw new ClientApiError(normalizeError(parsedParams.error, "input"));
	}

	return await getPaginated(`/users?${parsedParams.data}`, userSchema, signal);
}

export async function getAdminUserByIdApi(
	userId: string,
	signal: AbortSignal,
): Promise<User> {
	const parsedId = idSchema.safeParse(userId);
	if (!parsedId.success) {
		throw new ClientApiError(normalizeError(parsedId.error, "input"));
	}

	return await get(`/users/${parsedId.data}`, userSchema, signal);
}

export async function updateUserApi(data: UpdateUser): Promise<User> {
	const parsedData = updateUserSchema.safeParse(data);
	if (!parsedData.success) {
		throw new ClientApiError(normalizeError(parsedData.error, "input"));
	}

	const { userId, ...body } = parsedData.data;
	return await patch(`/users/${userId}`, body, userSchema);
}

export async function deleteUserApi(userId: string): Promise<void> {
	const parsedId = idSchema.safeParse(userId);
	if (!parsedId.success) {
		throw new ClientApiError(normalizeError(parsedId.error, "input"));
	}

	return await del(`/users/${parsedId.data}`);
}
