// src/pages/notifications/NotificationsPage.tsx
import { Link } from "react-router-dom";
import { useNotifications, formatTimeAgo } from "../../hooks/useNotifications";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Separator } from "../../components/ui/separator";
import { useAuth } from "../../auth/useAuth"; // use your real auth hook

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth() as any; // adjust typing if you have it
  const { items, loading, markAll, markOneRead } = useNotifications(user?.id);

  if (authLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }
  if (!user) {
    return <div className="p-6 text-sm text-muted-foreground">You need to sign in.</div>;
  }

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <Button variant="outline" onClick={markAll} disabled={loading}>
          Mark all as read
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">
            {loading ? "Loading…" : `${items.length} notifications`}
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {!loading && items.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">You’re all caught up 🎉</div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <li key={n.id} className={`px-4 py-3 ${n.is_read ? "opacity-70" : ""}`}>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={n.sender?.avatar_url || ""} />
                      <AvatarFallback>
                        {n.sender?.username?.slice(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm">
                        <span className="font-medium">{n.sender?.username}</span>{" "}
                        <span className="text-muted-foreground">{n.message}</span>{" "}
                        {n.post && (
                          <Link
                            to={`/posts/${n.post.slug ?? n.post.id}`}
                            className="text-primary hover:underline"
                          >
                            View post
                          </Link>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatTimeAgo(n.created_at)}
                      </div>
                    </div>

                    {!n.is_read ? (
                      <Button size="sm" variant="ghost" onClick={() => markOneRead(n.id)}>
                        Mark read
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
