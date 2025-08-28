import { useEffect, useMemo, useState } from 'react'
import { getMe } from '../api/users'
import { getFollowing, followUser, unfollowUser } from '../api/users'

export function useFollow() {
  const [meId, setMeId] = useState<number | null>(null)
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const me = await getMe()
        setMeId(me.id)
        const list = await getFollowing(me.id)
        setFollowingIds(new Set(list.map(u => u.id)))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function follow(targetId: number) {
    await followUser(targetId)
    setFollowingIds(prev => new Set(prev).add(targetId))
  }

  async function unfollow(targetId: number) {
    await unfollowUser(targetId)
    setFollowingIds(prev => {
      const next = new Set(prev)
      next.delete(targetId)
      return next
    })
  }

  function isFollowing(targetId: number) {
    return followingIds.has(targetId)
  }

  return { meId, loading, followingIds, isFollowing, follow, unfollow }
}
