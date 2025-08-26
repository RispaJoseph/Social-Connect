import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  withCredentials: true,
});

API.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("access");

  // Ensure headers object exists, cast to proper type
  config.headers = config.headers ?? {} as Record<string, string>;

  // Add Authorization only for protected endpoints
  if (
    token &&
    !config.url?.includes("/auth/register") &&
    !config.url?.includes("/auth/login")
  ) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});

export default API;
