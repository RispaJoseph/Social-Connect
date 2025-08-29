// src/components/people/PeopleSidebar.tsx
import { useEffect, useMemo, useState } from 'react'
import { getMe, getFollowing } from '../../api/users'
import FollowButton from '../follow/FollowButton'
import { api } from '../../lib/api'
import { toast } from 'sonner'
import { Link } from "react-router-dom";

type FollowUser = { id: number; username: string; email?: string }
type PublicProfile = {
  avatar_url?: string | null
  user?: { id: number; username: string }
}

type Tab = 'following' | 'followers'

export default function PeopleSidebar() {
  const [tab, setTab] = useState<Tab>('following')

  const [following, setFollowing] = useState<FollowUser[]>([])
  const [followers, setFollowers] = useState<FollowUser[]>([])

  const [avatars, setAvatars] = useState<Record<number, string | null>>({})
  const [loading, setLoading] = useState(true)
  const [loadingFollowers, setLoadingFollowers] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)

        // who am I?
        const me = await getMe()

        // ---- Following ----
        const rawFollowing = await getFollowing(me.id) // could be array or {results}
        const followingList: FollowUser[] = normalizeList(rawFollowing)
        setFollowing(followingList)

        // prefetch avatars for following
        await hydrateAvatars(followingList, setAvatars)

        // ---- Followers ----
        setLoadingFollowers(true)
        const followersResp = await api.get(`/auth/followers/${me.id}/`)
        const followersList: FollowUser[] = normalizeList(followersResp.data)
        setFollowers(followersList)

        // prefetch avatars for followers (don’t overwrite existing)
        await hydrateAvatars(followersList, setAvatars)
      } catch (e) {
        toast.error('Failed to load people')
      } finally {
        setLoading(false)
        setLoadingFollowers(false)
      }
    })()
  }, [])

  // Helper: normalize backend list shapes to FollowUser[]
  function normalizeList(raw: any): FollowUser[] {
    const arr = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : []
    return arr
      .map((x: any) => {
        // support shapes like {id, username} or {user: {id, username}} or {follower: {...}} etc.
        const u = x?.user || x?.follower || x?.following || x
        if (!u) return null
        return {
          id: Number(u.id),
          username: String(u.username ?? ''),
          email: u.email,
        } as FollowUser
      })
      .filter(Boolean)
  }

  // Helper: fetch avatars by username route you already use
  async function hydrateAvatars(list: FollowUser[], setMap: (fn: (m: Record<number, string | null>) => Record<number, string | null>) => void) {
    if (!list || list.length === 0) return
    const promises = list.map(async (u) => {
      try {
        const { data } = await api.get<PublicProfile>(`/auth/by-username/${encodeURIComponent(u.username)}/`)
        const uid = (data as any)?.user?.id ?? u.id
        return [uid, data?.avatar_url ?? null] as [number, string | null]
      } catch {
        return [u.id, null] as [number, string | null]
      }
    })
    const profiles = await Promise.all(promises)
    setMap((prev) => {
      const next = { ...prev }
      for (const [id, url] of profiles) {
        if (next[id] == null) next[id] = url // don’t clobber existing
      }
      return next
    })
  }

  const followingRows = useMemo(
    () => following.map((u) => ({ ...u, avatar_url: avatars[u.id] || null })),
    [following, avatars]
  )
  const followersRows = useMemo(
    () => followers.map((u) => ({ ...u, avatar_url: avatars[u.id] || null })),
    [followers, avatars]
  )

  const rows = tab === 'following' ? followingRows : followersRows
  const busy = loading || (tab === 'followers' && loadingFollowers)

  return (
    <div className="bg-white rounded-2xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        {/* <h3 className="font-semibold">People</h3> */}
        <div className="flex gap-1 rounded-md border overflow-hidden">
          <button
            className={`px-12 py-1.5 text-sm ${tab === 'following' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
            onClick={() => setTab('following')}
            aria-pressed={tab === 'following'}
          >
            Following
          </button>
          <button
            className={`px-12 py-1.5 text-sm ${tab === 'followers' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
            onClick={() => setTab('followers')}
            aria-pressed={tab === 'followers'}
          >
            Followers 
          </button>
        </div>
      </div>

      {busy && <div className="text-sm text-gray-600">Loading…</div>}

      {!busy && rows.length === 0 && (
        <div className="text-sm text-gray-600">
          {tab === 'following' ? 'You aren’t following anyone yet!' : 'No one is following you yet.'}
        </div>
      )}

      <div className="space-y-3">
        {!busy &&
          rows.map((u) => (
            <div key={`${tab}-${u.id}`} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Link to={`/profile/${u.id}`} className="flex items-center gap-2 min-w-0">
                <img
                  src={u.avatar_url || 'https://via.placeholder.com/32?text=%F0%9F%91%A4'}
                  className="w-8 h-8 rounded-full border object-cover"
                  alt=""
                /></Link>
                <Link to={`/profile/${u.id}`} className="flex items-center gap-2 min-w-0">
                  <div className="truncate text-sm">{u.username}</div>
                </Link>
              </div>
              <FollowButton userId={u.id} />
            </div>
          ))}
      </div>
    </div>
  )
}
