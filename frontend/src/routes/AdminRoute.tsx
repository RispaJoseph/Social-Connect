// src/layouts/AdminLayout.tsx
import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  const linkBase =
    "px-3 py-2 rounded-md text-sm border transition-colors";
  const active = "bg-black text-white border-black";
  const idle = "bg-white text-black border-gray-200 hover:bg-gray-50";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Admin</h1>
      <div className="mb-6 flex gap-2">
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
