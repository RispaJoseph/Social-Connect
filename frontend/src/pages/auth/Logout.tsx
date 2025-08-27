// src/pages/auth/Logout.tsx
import React, { useEffect } from "react";
import API from "../../api/axios";
import { useNavigate } from "react-router-dom";

const Logout: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      try {
        const refresh =
          localStorage.getItem("refresh") || localStorage.getItem("refresh_token");

        // Call backend logout if we have a refresh token
        if (refresh) {
          try {
            await API.post("/auth/logout/", { refresh });
          } catch (e) {
            // If the server rejects (expired/invalid), we still clear client state below
            console.warn("Server logout failed (continuing):", e);
          }
        }
      } finally {
        // Clear ALL possible token keys used in the app
        try {
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        } catch {}

        // Redirect to login
        navigate("/login", { replace: true });
      }
    };

    logout();
  }, [navigate]);

  return <div>Logging out...</div>;
};

export default Logout;
