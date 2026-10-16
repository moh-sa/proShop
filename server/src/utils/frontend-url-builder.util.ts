import { env } from "../config/env.js";

const baseURL = env.APP_URL;

export const frontendUrlBuilder = {
	checkoutFailure: (params: { orderId: string }) =>
		`${baseURL}/orders/${params.orderId}/failure`,
	checkoutSuccess: (params: { orderId: string }) =>
		`${baseURL}/orders/${params.orderId}/success`,
};
