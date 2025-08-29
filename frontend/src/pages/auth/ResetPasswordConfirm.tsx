import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { confirmPasswordReset } from "../../api/auth";
import { toast } from "sonner";

export default function ResetPasswordConfirm() {
  const { uidb64, token } = useParams<{ uidb64: string; token: string }>();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [show, setShow] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uidb64 || !token) {
      toast.error("Invalid reset link.");
      return;
    }
    if (newPassword !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset({ uidb64, token, new_password: newPassword });
      setDone(true);
      toast.success("Password reset successfully");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        "Reset link is invalid or expired";
      toast.error(msg);
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
        <h1 className="text-2xl font-semibold mb-4">Set a new password</h1>

        {done ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Your password has been reset successfully.
            </p>
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="w-full bg-black text-white rounded-md py-2"
            >
              Go to login
            </button>
          </div>
        ) : (
          <>
            <label className="block text-sm mb-1">New password</label>
            <div className="mb-3 flex items-center gap-2">
              <input
                type={show ? "text" : "password"}
                className="w-full border rounded-md px-3 py-2"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="text-xs px-2 py-1 border rounded-md"
                onClick={() => setShow((s) => !s)}
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>

            <label className="block text-sm mb-1">Confirm new password</label>
            <input
              type={show ? "text" : "password"}
              className="w-full border rounded-md px-3 py-2 mb-4"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />

            <button
              type="submit"
              className="w-full bg-black text-white rounded-md py-2 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Saving..." : "Reset password"}
            </button>

            <p className="text-sm mt-4">
              Remembered it?{" "}
              <Link to="/login" className="text-blue-600 hover:underline">
                Back to login
              </Link>
            </p>
          </>
        )}
      </form>
    </div>
  );
}
