// src/components/posts/PostEditor.tsx
import React, { useRef, useState } from "react";
import type { Post } from "../../api/posts";
import type { PostCategory } from "../../api/posts";

const CATEGORY_OPTIONS: { value: PostCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "announcement", label: "Announcement" },
  { value: "question", label: "Question" },
];

type Props = {
  post: Post;
  onSave: (values: { content: string; category: PostCategory; image?: File | null }) => Promise<void>;
  onClose: () => void;
};

export default function PostEditor({ post, onSave, onClose }: Props) {
  const [content, setContent] = useState(post.content);
  const [category, setCategory] = useState<PostCategory>(post.category);
  const [preview, setPreview] = useState<string | null>(post.image_url || null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [imageFile, setImageFile] = useState<File | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      await onSave({ content, category, image: imageFile });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save post");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Edit post</h3>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">✕</button>
        </div>

        <div className="mt-3 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={280}
            rows={4}
            className="w-full resize-none rounded-xl border p-3 outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="What's happening?"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PostCategory)}
              className="rounded-lg border px-3 py-2"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {preview && (
            <div className="overflow-hidden rounded-xl border">
              <img src={preview} alt="preview" className="max-h-[360px] w-full object-cover" />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png"
                hidden
                onChange={onPick}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="rounded-lg border px-3 py-2 hover:bg-slate-50"
              >
                Replace Image
              </button>
              {preview && (
                <button
                  onClick={() => {
                    setPreview(null);
                    setImageFile(null);
                  }}
                  className="rounded-lg border px-3 py-2 text-rose-600 hover:bg-rose-50"
                >
                  Remove Image
                </button>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>

          {error && <div className="text-sm text-rose-600">{error}</div>}
        </div>
      </div>
    </div>
  );
}
