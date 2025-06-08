import { Button } from "@/components/ui/button";
import {
  MessageSquarePlus,
  Trash2,
  Menu,
  X,
  Bot,
  MessageCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatHistory {
  chat_id: number;
  title: string;
  updated_at: string;
}

interface ChatSidebarProps {
  chatHistory: ChatHistory[];
  currentChatId: number | null;
  onNewChat: () => void;
  onSelectChat: (chatId: number) => void;
  onDeleteChat: (chatId: number) => Promise<void>;
  isOpen: boolean;
  onToggle: () => void;
  isLoading: boolean;
}

export function ChatSidebar({
  chatHistory,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isOpen,
  onToggle,
  isLoading,
}: ChatSidebarProps) {
  const [deletingChatId, setDeletingChatId] = useState<number | null>(null);

  return (
    <>
      {/* Nút menu mobile - ẩn khi sidebar mở */}
      <Button
        variant="ghost"
        size="icon"
        className={`md:hidden fixed top-20 left-4 z-50 ${
          isOpen ? "hidden" : "block"
        }`}
        onClick={onToggle}
      >
        <Menu className="h-6 w-6" />
      </Button>

      {/* Sidebar container */}
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -300, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`
          fixed md:relative
          inset-y-0 left-0
          w-64 h-full
          transform transition-transform duration-200
          md:transform-none
          ${!isOpen ? "-translate-x-full" : "translate-x-0"}
          bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-r border-white/20 dark:border-slate-700/50
          flex flex-col
          z-40
          shadow-2xl
        `}
      >
        {/* Header với nút close */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/20 dark:border-slate-700/50">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Chat
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="hover:bg-white/20 dark:hover:bg-slate-700/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Header cho desktop */}
        <div className="hidden md:flex items-center gap-3 p-4 border-b border-white/20 dark:border-slate-700/50">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Chat
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Trợ lý sáng tạo
            </p>
          </div>
        </div>

        <div className="p-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={onNewChat}
              disabled={isLoading}
            >
              <MessageSquarePlus className="mr-2 h-4 w-4" />✨ Cuộc trò chuyện
              mới
            </Button>
          </motion.div>
        </div>
        <div className="flex-1 overflow-y-auto px-2">
          <div className="space-y-2">
            {chatHistory.length === 0 ? (
              <div className="p-4 text-center">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Chưa có cuộc trò chuyện nào
                </p>
              </div>
            ) : (
              chatHistory.map((chat, index) => (
                <motion.div
                  key={chat.chat_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`
                    group flex items-center justify-between p-3 cursor-pointer rounded-2xl transition-all duration-200
                    ${
                      currentChatId === chat.chat_id
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-300/50 dark:border-blue-700/50"
                        : "hover:bg-white/50 dark:hover:bg-slate-700/50"
                    }
                    ${
                      deletingChatId === chat.chat_id
                        ? "opacity-50 pointer-events-none"
                        : ""
                    }
                    ${isLoading ? "pointer-events-none opacity-50" : ""}
                  `}
                  onClick={() => !isLoading && onSelectChat(chat.chat_id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        currentChatId === chat.chat_id
                          ? "bg-gradient-to-br from-blue-500 to-purple-500"
                          : "bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700"
                      }`}
                    >
                      <MessageCircle
                        className={`w-4 h-4 ${
                          currentChatId === chat.chat_id
                            ? "text-white"
                            : "text-slate-600 dark:text-slate-300"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`truncate text-sm font-medium ${
                          currentChatId === chat.chat_id
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {chat.title || "💬 Cuộc trò chuyện mới"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDistanceToNow(new Date(chat.updated_at), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                    onClick={async (e) => {
                      e.stopPropagation();
                      setDeletingChatId(chat.chat_id);
                      await onDeleteChat(chat.chat_id);
                      setDeletingChatId(null);
                    }}
                    disabled={deletingChatId === chat.chat_id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>

      {/* Overlay khi mở menu trên mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}
