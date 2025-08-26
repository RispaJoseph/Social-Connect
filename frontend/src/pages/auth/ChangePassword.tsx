import React, { useState } from "react";
import API from "../../api/axios";

const ChangePassword: React.FC = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.post("/auth/change-password/", { old_password: oldPassword, new_password: newPassword });
      setMessage("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      setMessage(err.response?.data?.new_password || err.response?.data?.old_password || "Failed to change password");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Change Password</h2>
      {message && <p className="text-red-500 mb-2">{message}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          placeholder="Old password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          className="border rounded p-2"
          required
        />
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="border rounded p-2"
          required
        />
        <button className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
          Change Password
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
