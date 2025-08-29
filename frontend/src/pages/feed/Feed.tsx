// src/pages/feed/Feed.tsx
import { useEffect, useState } from 'react'
import { getFeed, createPost, updatePost, deletePost } from '../../api/posts'
import { useAuth } from '../../auth/useAuth'
import PeopleSidebar from '../../components/people/PeopleSidebar'
import FollowersSidebar from '../../components/people/FollowersSidebar'
import { toast } from 'sonner'
import LikeButton from '../../components/engagement/LikeButton'
import Comments from '../../components/engagement/Comments'
import { Link } from 'react-router-dom'
import FollowList from "../../components/follow/FollowList";
import SuggestedUsers from "../../components/follow/SuggestedUsers";

export default function Feed() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [feed, setFeed] = useState<{ results: any[]; next?: string | null; previous?: string | null } | null>(null)
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | undefined>(undefined)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editFile, setEditFile] = useState<File | undefined>(undefined)

  async function load(p = page) {
    const data = await getFeed(p)
    setFeed(data)
  }

  useEffect(() => { load(page) }, [page])

  async function onCreatePost(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) { toast.error('Post cannot be empty'); return }
    if (content.length > 280) { toast.error('Max 280 chars'); return }
    try {
      await createPost(content, file)
      setContent('')
      setFile(undefined)
      toast.success('Posted')
      setPage(1)
      await load(1)
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to post')
    }
  }

  function startEdit(p: any) {
    setEditingId(p.id)
    setEditContent(p.content)
    setEditFile(undefined)
  }

  async function saveEdit(id: number) {
    try {
      await updatePost(id, editContent, editFile)
      toast.success('Post updated')
      setEditingId(null)
      await load(page)
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Update failed')
    }
  }

  async function removePost(id: number) {
    if (!confirm('Delete this post?')) return
    try {
      await deletePost(id)
      toast.success('Post deleted')
      setPage(1)
      await load(1)
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Delete failed')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main column */}
      <div className="lg:col-span-2">
        {/* Composer */}
        <form onSubmit={onCreatePost} className="bg-white rounded-2xl border p-4 mb-6">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's happening?"
            className="w-full border rounded-md p-3 h-15"
          />
          <div className="mt-3 flex items-center gap-3">
            <input type="file" accept="image/png,image/jpeg" onChange={e => setFile(e.target.files?.[0])} />
            <button className="ml-auto px-4 py-2 bg-black text-white rounded-md">Post</button>
          </div>
        </form>

        {/* Posts list */}
        <div className="space-y-4">
          {feed?.results?.map((p: any) => (
            <div key={p.id} className="bg-white border rounded-2xl p-4">
              {/* Header with avatar + username + timestamp + actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={p.author_avatar || 'https://via.placeholder.com/32?text=%F0%9F%91%A4'}
                    className="w-8 h-8 rounded-full border object-cover"
                    alt=""
                  />
                  <div className="min-w-0">
                    <Link
                      to={`/profile/${p.author}`} // or `/u/${p.author_username}` if you have that route
                      className="font-medium hover:underline block truncate"
                      title={p.author_username}
                    >
                      {p.author_username || 'unknown'}
                    </Link>
                    <div className="text-xs text-gray-500 truncate">
                      {new Date(p.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                {user?.id === p.author && (
                  <div className="flex gap-2 shrink-0">
                    {editingId === p.id ? (
                      <>
                        <button className="text-sm px-2 py-1 border rounded" onClick={() => saveEdit(p.id)}>Save</button>
                        <button className="text-sm px-2 py-1 border rounded" onClick={() => setEditingId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="text-sm px-2 py-1 border rounded" onClick={() => startEdit(p)}>Edit</button>
                        <button className="text-sm px-2 py-1 border rounded" onClick={() => removePost(p.id)}>Delete</button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Content / editor */}
              {editingId === p.id ? (
                <>
                  <textarea
                    className="w-full border rounded-md p-2 my-2"
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    maxLength={280}
                  />
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={e => setEditFile(e.target.files?.[0])}
                  />
                </>
              ) : (
                <>
                  <div className="whitespace-pre-wrap my-2">{p.content}</div>
                  {p.image_url && <img src={p.image_url} className="rounded-lg border" />}
                </>
              )}

              {/* Engagement row */}
              <div className="mt-2 flex items-center gap-3">
                <LikeButton
                  postId={p.id}
                  initialCount={p.like_count || 0}
                  // If you added liked_by_me in the API, you can pass it:
                  // initialLiked={p.liked_by_me}
                  onCountChange={(next) => { p.like_count = next }}
                />
                <span className="text-sm text-gray-600">💬 {p.comment_count || 0}</span>
              </div>

              {/* Comments widget */}
              <Comments
                postId={p.id}
                initialCount={p.comment_count || 0}
                onCountChange={(next) => { p.comment_count = next }}
              />
            </div>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-2">
            <button
              disabled={!feed?.previous}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded border disabled:opacity-50"
            >
              Prev
            </button>
            <span className="text-sm">Page {page}</span>
            <button
              disabled={!feed?.next}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded border disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="space-y-4">
        {/* <div className="bg-white rounded-2xl border p-4">
          <h3 className="font-semibold mb-2">Notifications</h3>
          <p className="text-sm text-gray-600">
            Realtime is next; we’ll subscribe to Supabase notifications here.
          </p>
        </div> */}

        <PeopleSidebar />
        <SuggestedUsers />
        

      </aside>
    </div>
  )
}
