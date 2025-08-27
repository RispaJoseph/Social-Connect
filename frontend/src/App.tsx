import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPasswordConfirm from "./pages/auth/ResetPasswordConfirm";
import ChangePassword from "./pages/profile/ChangePassword";
import Feed from "./pages/Feed";
import MyProfile from "./pages/profile/MyProfile";
import UserProfile from "./pages/profile/UserProfile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email/:uid/:token" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:uid/:token" element={<ResetPasswordConfirm />} />
      <Route path="/change-password" element={<ChangePassword />} />
      <Route path="/feed" element={<Feed />} />

      {/* Profile */}
      <Route path="/me" element={<MyProfile />} />
      <Route path="/users/:id" element={<UserProfile />} />
      <Route path="/change-password" element={<ChangePassword />} />
    </Routes>
  );
}

export default App;
