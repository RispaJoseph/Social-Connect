import api from "./axios";


export async function uploadAvatar(file: File, token: string) {
  const form = new FormData();
  form.append("avatar", file);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/me/avatar/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to upload avatar: ${res.status} ${err}`);
  }
  return (await res.json()) as { avatar_url: string };
}

export async function getUserById(userId: number) {
  const { data } = await api.get(`/api/users/${userId}/`);
  return data; // profile payload
}
