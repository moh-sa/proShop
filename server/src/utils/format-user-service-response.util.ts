import type { SelectUser } from "../types/index.js";

import { generateJwtToken } from "./jwt-generate-token.util.js";
import { removeObjectFields } from "./remove-object-fields.js";

export function formatUserServiceResponse(data: {
	isTokenRequired?: boolean;
	user: SelectUser;
}): Omit<SelectUser, "password"> {
	const res = removeObjectFields(data.user, ["password", "token"]);

	return {
		...res,
		...(data.isTokenRequired && {
			token: generateJwtToken({ id: data.user._id }),
		}),
	};
}
