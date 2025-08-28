// src/pages/profile/Profile.tsx
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getMe, updateMe, uploadAvatar, Me } from '../../api/users'
import { getPublicProfileById } from '../../api/users'
import { toast } from 'sonner'
import FollowButton from '../../components/follow/FollowButton'
import { useAuth } from '../../auth/useAuth'

type PublicProfile = {
  id: number
  username?: string
  email?: string
  bio?: string | null
  avatar_url?: string | null
  website?: string | null
  location?: string | null
  visibility?: 'public' | 'private' | 'followers_only'
  followers_count?: number
  following_count?: number
  posts_count?: number
  user?: { id: number; username: string; email?: string }
}

export default function Profile() {
  const { user } = useAuth()
  // 🔑 match your router: /profile/:id
  const { id } = useParams<{ id?: string }>()
  const [me, setMe] = useState<Me | null>(null)
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const viewingOwn = useMemo(() => {
    if (!id) return true
    if (!user) return false
    return String(user.id) === String(id)
  }, [id, user])

  useEffect(() => {
    (async () => {
      try {
        if (viewingOwn) {
          const mine = await getMe()
          setMe(mine)
          setPublicProfile(null)
        } else if (id) {
          const prof = await getPublicProfileById(Number(id))
          setPublicProfile(normalizePublic(prof))
          setMe(null)
        }
      } catch (e: any) {
        toast.error(e?.response?.data?.detail || 'Failed to load profile')
      }
    })()
  }, [id, viewingOwn])

  function normalizePublic(p: any): PublicProfile {
    const u = p?.user || {}
    return {
      id: p?.id,
      username: u?.username ?? p?.username,
      email: u?.email ?? p?.email,
      bio: p?.bio ?? '',
      avatar_url: p?.avatar_url ?? null,
      website: p?.website ?? '',
      location: p?.location ?? '',
      visibility: p?.visibility ?? 'public',
      followers_count: p?.followers_count ?? 0,
      following_count: p?.following_count ?? 0,
      posts_count: p?.posts_count ?? 0,
      user: u?.id ? { id: u.id, username: u.username, email: u.email } : undefined,
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    if (!me) return
    setSaving(true)
    try {
      const next = await updateMe({
        bio: me.bio || '',
        website: me.website || '',
        location: me.location || '',
        visibility: (me.visibility as any) || 'public',
      })
      setMe(next)
      toast.success('Profile updated')
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Update failed')
    } finally { setSaving(false) }
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/png','image/jpeg'].includes(file.type)) { toast.error('Only JPEG/PNG allowed'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Max 2MB'); return }
    setAvatarUploading(true)
    try {
      const { avatar_url } = await uploadAvatar(file)
      setMe(m => m ? { ...m, avatar_url } : m)
      toast.success('Avatar updated')
    } catch {
      toast.error('Avatar upload failed')
    } finally { setAvatarUploading(false) }
  }

  if (viewingOwn && !me) return <div>Loading…</div>
  if (!viewingOwn && !publicProfile) return <div>Loading…</div>

  const base = viewingOwn ? me! : publicProfile!

  return (
    <div className="max-w-2xl mx-auto bg-white border rounded-2xl p-6 space-y-6">
      <div className="flex items-center gap-4">
        <img
          src={base.avatar_url || 'https://via.placeholder.com/96?text=👤'}
          className="w-20 h-20 rounded-full border object-cover"
          alt=""
        />
        <div className="flex-1">
          <div className="font-semibold text-lg">{viewingOwn ? me!.username : base.username}</div>
          <div className="text-sm text-gray-600">{viewingOwn ? me!.email : base.email}</div>

          {viewingOwn ? (
            <>
              <input type="file" accept="image/png,image/jpeg" onChange={onAvatarChange} />
              {avatarUploading && <div className="text-xs text-gray-500 mt-1">Uploading...</div>}
            </>
          ) : (
            <div className="mt-2">
              <FollowButton userId={Number(id)} />
            </div>
          )}
        </div>
      </div>

      {viewingOwn ? (
        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Bio (max 160)</label>
            <textarea
              className="w-full border rounded-md p-2"
              value={me!.bio || ''} maxLength={160}
              onChange={e => setMe({ ...me!, bio: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Website</label>
              <input className="w-full border rounded-md p-2"
                value={me!.website || ''} onChange={e => setMe({ ...me!, website: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Location</label>
              <input className="w-full border rounded-md p-2"
                value={me!.location || ''} onChange={e => setMe({ ...me!, location: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Visibility</label>
            <select
              className="border rounded-md p-2"
              value={me!.visibility || 'public'}
              onChange={e => setMe({ ...me!, visibility: e.target.value as any })}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="followers_only">Followers only</option>
            </select>
          </div>

          <button className="px-4 py-2 bg-black text-white rounded-md disabled:opacity-60" disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          {base.bio && <p className="whitespace-pre-wrap">{base.bio}</p>}
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
            <div><span className="text-gray-500">Website:</span> {base.website || '—'}</div>
            <div><span className="text-gray-500">Location:</span> {base.location || '—'}</div>
            <div><span className="text-gray-500">Followers:</span> {base.followers_count ?? 0}</div>
            <div><span className="text-gray-500">Following:</span> {base.following_count ?? 0}</div>
            <div><span className="text-gray-500">Posts:</span> {base.posts_count ?? 0}</div>
          </div>
        </div>
      )}
    </div>
  )
}
