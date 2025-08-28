import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../lib/api";

export default function VerifyEmail() {
  const { uidb64, token } = useParams<{ uidb64: string; token: string }>();
  const [status, setStatus] = useState<"loading"|"ok"|"error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    (async () => {
      try {
        await api.get(`/auth/verify-email/${uidb64}/${token}/`);
        setStatus("ok");
        setMessage("Your email has been verified. You can now log in.");
      } catch (e: any) {
        setStatus("error");
        setMessage(e?.response?.data?.detail || "Verification failed. Link may be invalid or expired.");
      }
    })();
  }, [uidb64, token]);

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="max-w-md w-full bg-white border rounded-2xl p-6">
        <h1 className="text-xl font-semibold mb-2">Email Verification</h1>
        <p className="text-sm text-gray-700">{message}</p>
        <div className="mt-4">
          {status === "ok" ? (
            <Link to="/login" className="px-4 py-2 rounded-md bg-black text-white">Go to Login</Link>
          ) : (
            <Link to="/" className="px-4 py-2 rounded-md border">Back to Home</Link>
          )}
        </div>
      </div>
    </div>
  );
}
