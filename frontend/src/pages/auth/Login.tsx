import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/axios";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await API.post("/auth/login/", form);
      const { access, refresh } = response.data;
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);
      navigate("/feed");
    } catch (err: any) {
      console.error(err.response?.data);

      if (err.response?.data?.detail === "User account is disabled.") {
        setError("Your account is not verified. Please check your email.");
      } else {
        setError(err.response?.data?.detail || "Login failed");
      }
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
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="border rounded p-2"
          required
        />
        <button
          type="submit"
          className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Login
        </button>
      </form>

      {/* Forgot password link */}
      <div className="mt-3 text-right">
        <Link to="/forgot-password" className="text-blue-500 hover:underline">
          Forgot password?
        </Link>
      </div>
    </div>
  );
};

export default Login;
