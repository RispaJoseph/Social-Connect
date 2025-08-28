import { useEffect, useState } from 'react'
import { addComment, deleteComment, getComments, Comment, getPost } from '../../api/posts'
import { toast } from 'sonner'
import { useAuth } from '../../auth/useAuth'

export default function Comments({
  postId,
  initialCount,
  onCountChange,
}: {
  postId: number
  initialCount: number
  onCountChange?: (next: number) => void
}) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [gone, setGone] = useState(false)

  async function load() {
    setLoading(true)
    try {
      await getPost(postId) // ensure it exists
      const list = await getComments(postId)
      setComments(list)
      setGone(false)
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setGone(true)
        setComments([])
      } else {
        toast.error('Failed to load comments')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [postId])

  async function onAdd(e: React.FormEvent) {
    e.preventDefault()
    if (gone) { toast.error('This post no longer exists.'); return }
    if (!content.trim()) return
    if (content.length > 200) { toast.error('Max 200 characters'); return }
    setBusy(true)
    try {
      const c = await addComment(postId, content.trim())
      setComments(prev => [c, ...prev])
      setContent('')
      setCount(n => n + 1); onCountChange?.(count + 1)
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setGone(true)
        toast.error('This post no longer exists.')
      } else {
        toast.error(e?.response?.data?.detail || 'Failed to comment')
      }
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(id: number) {
    if (!confirm('Delete this comment?')) return
    try {
      await deleteComment(id)
      setComments(prev => prev.filter(c => c.id !== id))
      setCount(n => n - 1); onCountChange?.(count - 1)
    } catch {
      toast.error('Failed to delete comment')
    }
  }

  if (gone) {
    return <div className="mt-2 text-sm text-gray-500">This post is no longer available.</div>
  }

  return (
    <div className="mt-2">
      <form onSubmit={onAdd} className="flex items-center gap-2">
        <input
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write a comment…"
          className="flex-1 border rounded-md px-3 py-2"
          maxLength={200}
        />
        <button className="px-3 py-2 border rounded-md" disabled={busy}>
          {busy ? '...' : 'Send'}
        </button>
      </form>

      {loading ? (
        <div className="text-sm text-gray-600 mt-2">Loading comments…</div>
      ) : comments.length === 0 ? (
        <div className="text-sm text-gray-600 mt-2">No comments yet.</div>
      ) : (
        <ul className="mt-3 space-y-2">
          {comments.map(c => (
            <li key={c.id} className="border rounded-md p-2">
              <div className="text-xs text-gray-500 flex items-center justify-between">
                <span>@{c.author_username || c.author} · {new Date(c.created_at).toLocaleString()}</span>
                {user?.id === c.author && (
                  <button className="text-xs px-2 py-1 border rounded" onClick={() => onDelete(c.id)}>
                    Delete
                  </button>
                )}
              </div>
              <div className="text-sm mt-1 whitespace-pre-wrap">{c.content}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
