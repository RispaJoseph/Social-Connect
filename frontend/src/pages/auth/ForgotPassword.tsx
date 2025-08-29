import { useState } from "react";
import { requestPasswordReset } from "../../api/auth";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset({ email });
      setSent(true);
      toast.success("Check your email for a reset link.");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white p-6 rounded-2xl shadow"
      >
        <h1 className="text-2xl font-semibold mb-4">Forgot Password</h1>
        {sent ? (
          <p className="text-sm text-gray-700">
            If an account exists with this email, a password reset link has been
            sent.
          </p>
        ) : (
          <>
            <label className="block text-sm mb-1">Enter your email</label>
            <input
              type="email"
              className="w-full border rounded-md px-3 py-2 mb-4"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full bg-black text-white rounded-md py-2 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </>
        )}

        <p className="text-sm mt-4">
          Remember your password?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Back to login
          </Link>
        </p>
      </form>
    </div>
  );
}
