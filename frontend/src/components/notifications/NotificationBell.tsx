import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useNotifications, formatTimeAgo } from "../../hooks/useNotifications";

// shadcn/ui
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";

type Props = {
  recipientId: string | number; // current user id
};

export default function NotificationBell({ recipientId }: Props) {
  const { items, unreadCount, markOneRead } = useNotifications(recipientId);

  const latest = useMemo(() => items.slice(0, 15), [items]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 min-w-[20px] justify-center rounded-full px-1 text-[10px] leading-5"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Open notifications</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <Link
            to="/notifications"
            className="text-xs text-muted-foreground hover:underline"
          >
            See all
          </Link>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {latest.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No notifications</div>
        ) : (
          <ScrollArea className="max-h-96">
            {latest.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={`p-2 focus:bg-accent ${
                  n.is_read ? "opacity-70" : "opacity-100"
                }`}
                onSelect={(e) => {
                  e.preventDefault();
                  markOneRead(n.id);
                }}
              >
                <div className="flex w-full items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={n.sender?.avatar_url || ""} />
                    <AvatarFallback>
                      {n.sender?.username?.slice(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">
                      <span className="font-medium">{n.sender?.username}</span>{" "}
                      <span className="text-muted-foreground">{n.message}</span>
                      {n.post && (
                        <>
                          {" "}
                          <Link
                            to={`/posts/${n.post.slug ?? n.post.id}`}
                            className="text-primary hover:underline"
                          >
                            View
                          </Link>
                        </>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatTimeAgo(n.created_at)}
                    </div>
                  </div>
                  {!n.is_read && <span className="mt-1 h-2 w-2 rounded-full bg-primary" />}
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
