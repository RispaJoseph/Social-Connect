import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/axios";

const ResetPasswordConfirm: React.FC = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // ✅ Call backend with uid and token in the URL
      await API.post(`/auth/password-reset-confirm/${uid}/${token}/`, {
        new_password: password,
      });

      setMessage("Password reset successful! You can now login.");
      setTimeout(() => navigate("/login"), 2000); // Redirect after 2s
    } catch (err: any) {
      console.error(err.response?.data);
      setMessage(err.response?.data?.new_password?.[0] || "Failed to reset password");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
      {message && <p className="text-red-500 mb-2">{message}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border rounded p-2"
          required
        />
        <button
          type="submit"
          className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Reset Password
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordConfirm;
