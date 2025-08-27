import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import type { AxiosError } from "axios";

type LoginForm = {
  username: string;
  password: string;
};

type LoginResponse = {
  access: string;
  refresh?: string;
  // add more fields if your API returns them
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginForm>({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);

    try {
      const response = await API.post<LoginResponse>("/auth/login/", form);

      const { access, refresh } = response.data || {};
      if (!access) throw new Error("No access token returned");

      // --- Single source of truth for tokens ---
      // Clear any legacy keys you might have used before
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      // Set the keys your axios client/interceptor expects
      localStorage.setItem("accessToken", access);
      if (refresh) localStorage.setItem("refreshToken", refresh);

      navigate("/feed");
    } catch (err) {
      const axErr = err as AxiosError<any>;
      const detail =
        axErr.response?.data?.detail ||
        (axErr.response?.data && typeof axErr.response.data === "string"
          ? axErr.response.data
          : null);

      if (detail === "User account is disabled.") {
        setError("Your account is not verified. Please check your email.");
      } else if (detail) {
        setError(detail);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          name="username"
          placeholder="Username or Email"
          value={form.username}
          onChange={handleChange}
          className="border rounded p-2"
          required
          autoComplete="username"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="border rounded p-2"
          required
          autoComplete="current-password"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* Left: New User | Right: Forgot password */}
      <div className="mt-3 flex justify-between">
        <Link to="/register" className="text-blue-500 hover:underline">
          New User?
        </Link>
        <Link to="/forgot-password" className="text-blue-500 hover:underline">
          Forgot password?
        </Link>
      </div>
    </div>
  );
};

export default Login;
