// src/pages/auth/Login.tsx
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { login } from "../../api/auth";
import { useAuth } from "../../auth/useAuth";
import { toast } from "sonner";

export default function Login() {
  const [username, setUsername] = useState(""); // send as "username" (can be email or username)
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login({ username, password });
      setUser(data.user);
      toast.success("Logged in");
      navigate(from, { replace: true }); // 👈 go back to where they came from (or "/")
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white p-6 rounded-2xl shadow">
        <h1 className="text-2xl font-semibold mb-4">Welcome back</h1>
        <label className="block text-sm mb-1">Email or username</label>
        <input
          className="w-full border rounded-md px-3 py-2 mb-3"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <label className="block text-sm mb-1">Password</label>
        <input
          className="w-full border rounded-md px-3 py-2 mb-4"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="w-full bg-black text-white rounded-md py-2 disabled:opacity-60" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <p className="text-sm mt-4">
          No account? <Link to="/register" className="text-blue-600">Sign up</Link>
        </p>
      </form>
    </div>
  );
}
