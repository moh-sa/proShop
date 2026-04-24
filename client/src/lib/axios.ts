import axios from "axios";
import { env } from "../env";

export const api = axios.create({
  baseURL: env.API_URL + "/api/v1",
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});
