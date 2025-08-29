// src/layouts/AdminLayout.tsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function AdminLayout() {
  const [allowed, setAllowed] = useState<null | boolean>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // probe backend permission
        await api.get("/admin/stats/");
        if (!alive) return;
        setAllowed(true);
      } catch {
        if (!alive) return;
        setAllowed(false);
        navigate("/", { replace: true });
      }
    })();
    return () => { alive = false; };
  }, [navigate]);

  if (allowed === null) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-600">
        Checking admin access…
      </div>
    );
  }

  const linkBase =
    "px-3 py-2 rounded-md text-sm border transition-colors";
  const active = "bg-black text-white border-black";
  const idle = "bg-white text-black border-gray-200 hover:bg-gray-50";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Admin</h1>

      <div className="mb-6 border rounded-md bg-white p-2 flex gap-2">
        <NavLink to="/admin/users" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          Users
        </NavLink>
        <NavLink to="/admin/posts" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          Posts
        </NavLink>
        <NavLink to="/admin/stats" className={({ isActive }) => `${linkBase} ${isActive ? active : idle}`}>
          Stats
        </NavLink>
      </div>

      <Outlet />
    </div>
  );
}
