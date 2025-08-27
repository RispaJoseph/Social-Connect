// src/api/axios.ts
import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from "axios";

const BASE_URL =
  (process.env.REACT_APP_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8000/api").replace(/\/$/, "");

const API = axios.create({ baseURL: BASE_URL });

function getToken(): string | null {
  try {
    // Single source of truth. Make sure your Login stores this key.
    return localStorage.getItem("accessToken");
  } catch {
    return null;
  }
}

API.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      // Normalize headers to AxiosHeaders so type + case handling are correct
      const headers =
        config.headers instanceof AxiosHeaders
          ? config.headers
          : new AxiosHeaders(config.headers as any);

      // Don't overwrite if caller already set Authorization
      if (!headers.has?.("Authorization")) {
        headers.set?.("Authorization", `Bearer ${token}`);
      } else if (typeof headers === "object") {
        // Fallback path for environments without AxiosHeaders class
        (headers as any)["Authorization"] =
          (headers as any)["Authorization"] ?? `Bearer ${token}`;
      }

      config.headers = headers;
    }
    return config; // must return InternalAxiosRequestConfig
  },
  (error: AxiosError) => Promise.reject(error)
);

export default API;
