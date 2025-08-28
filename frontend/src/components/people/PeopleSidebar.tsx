// src/components/people/PeopleSidebar.tsx
import { useEffect, useState, useMemo } from 'react'
import { getMe, getFollowing } from '../../api/users'
import FollowButton from '../follow/FollowButton'
import { api } from '../../lib/api'
import { toast } from 'sonner'

type FollowUser = { id: number; username: string; email?: string }
type PublicProfile = {
  avatar_url?: string | null
  user?: { id: number; username: string }
}

export default function PeopleSidebar() {
  const [following, setFollowing] = useState<FollowUser[]>([])
  const [avatars, setAvatars] = useState<Record<number, string | null>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe()
        const list = await getFollowing(me.id) // [{id, username}]
        const safe = Array.isArray(list) ? list : []
        setFollowing(safe)

        // fetch each public profile by username (reliable route)
        const profiles = await Promise.all(
          safe.map(async (u) => {
            try {
              const { data } = await api.get<PublicProfile>(`/auth/by-username/${encodeURIComponent(u.username)}/`)
              const uid = (data as any)?.user?.id ?? u.id
              return [uid, data?.avatar_url ?? null] as [number, string | null]
            } catch {
              return [u.id, null] as [number, string | null]
            }
          })
        )

        const map: Record<number, string | null> = {}
        for (const [id, url] of profiles) map[id] = url
        setAvatars(map)
      } catch {
        toast.error('Failed to load people')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const rows = useMemo(
    () =>
      following.map((u) => ({
        ...u,
        avatar_url: avatars[u.id] || null,
      })),
    [following, avatars]
  )

  return (
    <div className="bg-white rounded-2xl border p-4">
      <h3 className="font-semibold mb-2">People you follow</h3>
      {loading && <div className="text-sm text-gray-600">Loading…</div>}
      {!loading && rows.length === 0 && (
        <div className="text-sm text-gray-600">You aren’t following anyone yet.</div>
      )}
      <div className="space-y-3">
        {rows.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={u.avatar_url || 'https://via.placeholder.com/32?text=%F0%9F%91%A4'}
                className="w-8 h-8 rounded-full border object-cover"
                alt=""
              />
              <div className="truncate text-sm">{u.username}</div>
            </div>
            <FollowButton userId={u.id} />
          </div>
        ))}
      </div>
    </div>
  )
}
