import { env } from "@/env";
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const REFRESH_ENDPOINT = "/auth/token/refresh";

type RetryableRequestConfig = InternalAxiosRequestConfig & {
	// prevents endless retry loops after a 401 error - Internal flag
	_hasRetriedAfterRefresh?: boolean;
	// lets a request skip the refresh logic when needed - Internal flag
	_skipTokenRefresh?: boolean;
};

export const api = axios.create({
	baseURL: env.API_URL + "/api/v1",
	timeout: 10_000,
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true,
});

function isRefreshRequest(url?: string, skipTokenRefresh?: boolean): boolean {
	if (skipTokenRefresh) return true;
	if (!url) return false;

	const [path] = url.split("?");
	return path === REFRESH_ENDPOINT;
}

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (!(error instanceof AxiosError)) {
			return Promise.reject(error);
		}

		const originalRequest = error.config as RetryableRequestConfig | undefined;
		const status = error.response?.status;

		if (!originalRequest || status !== 401) {
			return Promise.reject(error);
		}

		if (
			// do not refresh token for refresh endpoint itself
			isRefreshRequest(
				originalRequest.url,
				originalRequest._skipTokenRefresh,
			) ||
			// retry only one time per failed request
			originalRequest._hasRetriedAfterRefresh
		) {
			return Promise.reject(error);
		}

		originalRequest._hasRetriedAfterRefresh = true;

		try {
			// ask server for a new access token then repeat original request
			await api.post(REFRESH_ENDPOINT);
			return api(originalRequest);
		} catch (refreshError) {
			return Promise.reject(refreshError);
		}
	},
);
