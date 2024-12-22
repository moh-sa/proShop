import axios from "axios";

const baseURL = import.meta.env.DEV
  ? import.meta.env.VITE_BACK_DEV_URL
  : import.meta.env.VITE_BACK_URL;

export const api = axios.create({
  baseURL,
});
