import { env } from "../config/env.js";

const baseURL = env.CLIENT_URL;

export const frontendUrlBuilder = {
	checkoutFailure: (params: { orderId: string }) =>
		`${baseURL}/order/${params.orderId}/failure`,
	checkoutSuccess: (params: { orderId: string }) =>
		`${baseURL}/order/${params.orderId}/success`,
};
