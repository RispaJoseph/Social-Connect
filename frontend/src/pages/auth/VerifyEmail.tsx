// src/pages/auth/VerifyEmail.tsx
import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const { uidb64, token } = useParams<{ uidb64: string; token: string }>();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");
  const verifiedRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!uidb64 || !token || verifiedRef.current) return;

    async function verify() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/auth/verify-email/${uidb64}/${token}/`
        );
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage(data.detail || "✅ Email verified successfully! Redirecting to login...");
          // Auto-redirect after 3 seconds
          setTimeout(() => navigate("/login"), 3000);
        } else {
          setStatus("error");
          setMessage(data.error || "❌ Verification failed. Link may be invalid or expired.");
        }
      } catch {
        setStatus("error");
        setMessage("⚠️ Something went wrong. Please try again later.");
      }
    }

    verify();
    verifiedRef.current = true;
  }, [uidb64, token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-md border rounded-2xl p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
        <p
          className={`text-sm ${
            status === "loading"
              ? "text-gray-500"
              : status === "success"
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {message}
        </p>

        <div className="mt-6">
          {status === "success" ? (
            <Link
              to="/login"
              className="px-4 py-2 rounded-md bg-black text-white inline-block"
            >
              Go to Login
            </Link>
          ) : (
            <Link
              to="/"
              className="px-4 py-2 rounded-md border inline-block"
            >
              Back to Home
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
