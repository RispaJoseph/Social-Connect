import { useState } from 'react'
import { useFollow } from '../../hooks/useFollow'
import { toast } from 'sonner'

export default function FollowButton({ userId, disabled }: { userId: number; disabled?: boolean }) {
  const { isFollowing, follow, unfollow, loading, meId } = useFollow()
  const [busy, setBusy] = useState(false)

  const mine = meId === userId
  if (mine) return null // don't show follow button for yourself

  const followed = isFollowing(userId)

  async function toggle() {
    try {
      setBusy(true)
      if (followed) {
        await unfollow(userId)
        toast.success('Unfollowed')
      } else {
        await follow(userId)
        toast.success('Followed')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={disabled || busy || loading}
      className={`px-3 py-1.5 rounded-md border text-sm ${
        followed ? 'bg-gray-100' : 'bg-black text-white'
      } disabled:opacity-50`}
    >
      {busy ? '...' : followed ? 'Unfollow' : 'Follow'}
    </button>
  )
}
