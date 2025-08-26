// src/pages/auth/VerifyEmail.tsx
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/axios";

const VerifyEmail = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      try {
        await API.get(`/auth/verify-email/${uid}/${token}/`);
        navigate("/login");
      } catch {
        navigate("/login"); // even if failed, redirect to login
      }
    };
    verify();
  }, [uid, token, navigate]);

  return null; // no UI needed
};

export default VerifyEmail;
