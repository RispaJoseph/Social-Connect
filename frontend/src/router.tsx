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
import NotificationsPage from "./pages/notifications/NotificationsPage";
import RouteError from "./RouteError";

import AdminLayout from "./layouts/AdminLayout";
import AdminUsersPage from "./pages/admin/Users";
import AdminPostsPage from "./pages/admin/Posts";
import AdminStatsPage from "./pages/admin/Stats";


export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <RouteError />,
    children: [
      { path: "/", element: <ProtectedRoute><Feed /></ProtectedRoute> },
      { path: "/posts/:id", element: <ProtectedRoute><PostDetail /></ProtectedRoute> },
      { path: "/profile/:id", element: <ProtectedRoute><Profile /></ProtectedRoute> },
      {
        path: "/admin",
        element: (
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <AdminStatsPage /> },   // /admin → Stats by default
          { path: "users", element: <AdminUsersPage /> }, // /admin/users
          { path: "posts", element: <AdminPostsPage /> }, // /admin/posts
          { path: "stats", element: <AdminStatsPage /> }, // /admin/stats
        ],
      },
      { path: "/notifications", element: (<ProtectedRoute><NotificationsPage /></ProtectedRoute>) },
      { path: "*", element: <NotFound /> },

    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/verify-email/:uidb64/:token", element: <VerifyEmail /> },
]);
