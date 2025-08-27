export type PostCategory = "general" | "announcement" | "question";

export interface Post {
  id: number;
  content: string;
  author: number;
  author_username: string;
  created_at: string; // ISO
  updated_at: string; // ISO
  image_url?: string | null;
  category: PostCategory;
  is_active: boolean;
  like_count: number;
  comment_count: number;
}

export interface Like {
  id: number;
  post: number;
  user: number;
  created_at: string; // ISO
}

export interface Comment {
  id: number;
  content: string;
  author: number;
  author_username: string;
  post: number;
  created_at: string; // ISO
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}