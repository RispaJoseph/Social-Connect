import React, { useState } from "react";
import API from "../../api/axios";

const PasswordReset: React.FC = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.post("/auth/password-reset/", { email });
      setMessage("Check your email for the reset link!");
    } catch (err: any) {
      setMessage(err.response?.data?.email || "Failed to send reset email");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Password Reset</h2>
      {message && <p className="text-green-500 mb-2">{message}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded p-2"
          required
        />
        <button className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
          Send Reset Link
        </button>
      </form>
    </div>
  );
};

export default PasswordReset;
