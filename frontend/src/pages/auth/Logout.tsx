import React, { useEffect } from "react";
import API from "../../api/axios";
import { useNavigate } from "react-router-dom";

const Logout: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      try {
        const refresh = localStorage.getItem("refresh");
        if (refresh) {
          await API.post("/auth/logout/", { refresh });
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
        }
      } catch (err) {
        console.error("Logout failed", err);
      } finally {
        navigate("/login");
      }
    };
    logout();
  }, [navigate]);

  return <div>Logging out...</div>;
};

export default Logout;
