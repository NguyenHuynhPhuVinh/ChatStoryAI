/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, MessageCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLoading } from "@/providers/loading-provider";

export function NotificationBell() {
  const { data: session } = useSession();
  const router = useRouter();
  const { startLoading } = useLoading();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
    }
  }, [session]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      const data = await response.json();
      if (response.ok) {
        setNotifications(data.notifications);
        setUnreadCount(
          data.notifications.filter((n: any) => !n.is_read).length
        );
      }
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
        }
      );
      if (response.ok) {
        setNotifications(
          notifications.map((n) =>
            n.notification_id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã đọc:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PUT",
      });
      if (response.ok) {
        setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Lỗi khi đánh dấu đọc tất cả:", error);
    }
  };

  const handleClick = (notification: any) => {
    handleMarkAsRead(notification.notification_id);
    startLoading(
      `/library/${notification.story_id}/chapters/${notification.chapter_id}`
    );
    router.push(
      `/library/${notification.story_id}/chapters/${notification.chapter_id}`
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative p-2 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 dark:from-slate-800/50 dark:to-slate-700/50 dark:hover:from-slate-700/70 dark:hover:to-slate-600/70 border border-blue-200/50 dark:border-slate-600/50 hover:border-blue-300/70 dark:hover:border-slate-500/70 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-[10px] font-bold text-white flex items-center justify-center shadow-lg"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
          {/* Pulse animation for new notifications */}
          {unreadCount > 0 && (
            <motion.div
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-400"
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 p-0 border-0 shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl overflow-hidden"
      >
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4 border-b border-blue-200/30 dark:border-slate-700/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 text-center">
              Thông Báo
            </span>
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-gray-900 dark:text-white">
                Tin nhắn mới
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>

            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
                className="text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Đọc tất cả
              </Button>
            )}
          </div>
        </div>
        {/* Notifications List */}
        <div className="max-h-[400px] overflow-y-auto p-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-8 h-8 text-blue-500" />
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                Chưa có thông báo mới
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                Thông báo sẽ xuất hiện ở đây khi có hoạt động mới
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.notification_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 4 }}
                >
                  <DropdownMenuItem
                    className={`p-0 cursor-pointer rounded-2xl overflow-hidden ${
                      !notification.is_read
                        ? "bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div
                      className="flex items-start gap-3 p-4 w-full"
                      onClick={() => handleClick(notification)}
                    >
                      {/* Message Icon */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex items-center justify-center shrink-0 mt-1">
                        <MessageCircle className="w-5 h-5 text-blue-500" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">
                          {notification.title}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {!notification.is_read && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                              <Sparkles className="w-3 h-3" />
                              Mới
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mark as read button */}
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 shrink-0"
                          title="Đánh dấu đã đọc"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.notification_id);
                          }}
                        >
                          <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                      )}
                    </div>
                  </DropdownMenuItem>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-slate-800/50 dark:to-slate-700/50 border-t border-blue-200/30 dark:border-slate-700/30">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>Luôn cập nhật những tin tức mới nhất!</span>
            </div>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
