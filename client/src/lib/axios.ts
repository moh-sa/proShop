import { env } from "@/env";
import axios from "axios";

export const api = axios.create({
	baseURL: env.API_URL + "/api/v1",
	timeout: 10_000,
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true,
});
