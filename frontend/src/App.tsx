// src/App.tsx
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./auth/useAuth";
import { Avatar } from "./components/Avatar";
import NotificationBell from "./components/notifications/NotificationBell";
import { useEffect, useState } from "react";
import { api } from "./lib/api";


export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showAdmin, setShowAdmin] = useState(false);
  const location = useLocation();



  useEffect(() => {
    if (showAdmin && location.pathname === "/") {
      navigate("/admin", { replace: true });
    }
  }, [showAdmin, location.pathname, navigate]);

  // Probe backend once per user to decide if Admin button should show
  useEffect(() => {
    let alive = true;

    async function checkAdmin() {
      if (!user) {
        setShowAdmin(false);
        return;
      }
      try {
        await api.get("/admin/stats/"); // server-authoritative check
        if (alive) setShowAdmin(true);
      } catch {
        if (alive) setShowAdmin(false);
      }
    }

    checkAdmin();
    return () => {
      alive = false;
    };
  }, [user?.id]); // re-check when user changes

  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link to="/" className="text-xl font-bold">
            SocialConnect
          </Link>

          <div className="ml-auto flex items-center gap-3">
            {user && <NotificationBell recipientId={user.id} />}

            {/* Show Admin button only if backend says user has access */}
            {/* {showAdmin && (
              <Link
                to="/admin"
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Admin
              </Link>
            )} */}

            {user && (
              <>
                <Link to={`/profile/${user.id}`} className="flex items-center gap-2">
                  <Avatar src={user.avatar_url} name={user.username} />
                  <span className="text-sm">{user.username}</span>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                  className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
