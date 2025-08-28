import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from './auth/useAuth'
import { Avatar } from './components/Avatar'

export default function App() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
          <Link to="/" className="font-bold text-xl">SocialConnect</Link>
          <div className="ml-auto flex items-center gap-3">
            {user && (
              <>
                <Link to={`/profile/${user.id}`} className="flex items-center gap-2">
                  <Avatar src={user.avatar_url} name={user.username} />
                  <span className="text-sm">{user.username}</span>
                </Link>
                <button onClick={() => { logout(); navigate('/login'); }} className="text-sm px-3 py-1.5 rounded-md border hover:bg-gray-50">
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
  )
}
