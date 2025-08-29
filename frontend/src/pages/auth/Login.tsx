// src/pages/auth/Login.tsx
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { login } from "../../api/auth";
import { useAuth } from "../../auth/useAuth";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react"; // 👈 import icons

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
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
      navigate(from, { replace: true });
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white p-6 rounded-2xl border shadow-sm"
      >
        <h1 className="text-2xl font-semibold mb-1">Welcome back</h1>
        <br />
        {/* <p className="text-sm text-gray-600 mb-5">Sign in to continue.</p> */}

        <label htmlFor="username" className="block text-sm mb-1">
          Email or username
        </label>
        <input
          id="username"
          className="w-full border rounded-md px-3 py-2 mb-3 outline-none focus:ring-2 focus:ring-black/10"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="password" className="block text-sm mb-1">
          Password
        </label>
        <div className="relative mb-2">
          <input
            id="password"
            className="w-full border rounded-md px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-black/10"
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
            aria-label={showPwd ? "Hide password" : "Show password"}
          >
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Links row */}
        <div className="mt-1 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
          <Link to="/forgot-password" className="text-blue-600 hover:underline">
            Forgot password?
          </Link>
          <span className="text-gray-600">
            No account?{" "}
            <Link to="/register" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </span>
        </div>

        <button
          className="w-full bg-black text-white rounded-md py-2 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
