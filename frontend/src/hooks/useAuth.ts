import { useEffect, useState } from "react";
import { storage } from "../lib/storage";

// Define your user type (match backend)
interface User {
  id: string | number;
  username: string;
  avatar_url?: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // If you already save user info in storage after login:
    const raw = storage.get("sc_user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        setUser(null);
      }
    }
  }, []);

  return { user };
}
