// src/router.tsx
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import Feed from "./pages/feed/Feed";
import Profile from "./pages/profile/Profile";
import PostDetail from "./pages/posts/PostDetail";
import Admin from "./pages/admin/Admin";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./routes/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <ProtectedRoute><Feed /></ProtectedRoute> },
      { path: "/posts/:id", element: <ProtectedRoute><PostDetail /></ProtectedRoute> },
      { path: "/profile/:id", element: <ProtectedRoute><Profile /></ProtectedRoute> },
      { path: "/admin", element: <ProtectedRoute roles={['admin']}><Admin /></ProtectedRoute> },
      { path: "*", element: <NotFound /> },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/verify-email/:uidb64/:token", element: <VerifyEmail /> },
]);
