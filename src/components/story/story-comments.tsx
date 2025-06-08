/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import TextareaAutosize from "react-textarea-autosize";
import { motion } from "framer-motion";
import { MessageCircle, Send } from "lucide-react";

export function StoryComments({ storyId }: { storyId: string }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const { data: session } = useSession();

  useEffect(() => {
    fetchComments();
  }, [storyId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/stories/${storyId}/comments`);
      const data = await res.json();
      setComments(data.comments);
    } catch (error) {
      console.error("Lỗi khi tải bình luận:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const res = await fetch(`/api/stories/${storyId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();

      toast.success(data.message);
      setContent("");
      fetchComments();
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const CommentItem = ({ comment, onDelete, onUpdate }: any) => {
    const { data: session } = useSession();
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);

    const isOwner = session?.user?.email === comment.user_email;

    const handleUpdate = async () => {
      if (!editContent.trim()) return;

      try {
        const res = await fetch(`/api/stories/${storyId}/comments`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commentId: comment.comment_id,
            content: editContent,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(data.message);
          onUpdate();
          setIsEditing(false);
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        toast.error("Có lỗi xảy ra");
      }
    };

    const handleDelete = async () => {
      if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;

      try {
        const res = await fetch(`/api/stories/${storyId}/comments`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ commentId: comment.comment_id }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(data.message);
          onDelete();
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        toast.error("Có lỗi xảy ra");
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/20 dark:border-slate-600/20 rounded-2xl p-4 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all duration-300"
      >
        <div className="flex gap-4">
          <UserAvatar size={40} showName={false} className="flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {comment.username}
                </span>
                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </span>
              </div>
              {isOwner && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="h-8 px-3 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    {isEditing ? "Hủy" : "Sửa"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="h-8 px-3 text-xs hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                  >
                    Xóa
                  </Button>
                </div>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <TextareaAutosize
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  minRows={2}
                  className="w-full resize-none rounded-xl border border-white/20 dark:border-slate-600/20 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300"
                  placeholder="Nhập nội dung bình luận..."
                />
                <Button
                  size="sm"
                  onClick={handleUpdate}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Send className="w-3 h-3 mr-1" />
                  Cập nhật
                </Button>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-xl p-3 border border-blue-100/50 dark:border-blue-800/30">
                <p className="text-sm leading-relaxed">{comment.content}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {session ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/20 dark:border-slate-600/20 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/50">
                <MessageCircle className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-foreground">
                  Viết bình luận
                </span>
              </div>
              <TextareaAutosize
                value={content}
                onChange={(e) => setContent(e.target.value)}
                minRows={3}
                className="w-full resize-none rounded-xl border border-white/20 dark:border-slate-600/20 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300"
                placeholder="Chia sẻ suy nghĩ của bạn về câu chuyện này..."
              />
              <div className="flex justify-end mt-3">
                <Button
                  type="submit"
                  disabled={!content.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Gửi bình luận
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-2xl p-6 text-center border border-blue-100/50 dark:border-blue-800/30"
        >
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-blue-400/50" />
          <p className="text-muted-foreground">
            Đăng nhập để tham gia thảo luận
          </p>
        </motion.div>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-2xl p-8 text-center border border-blue-100/50 dark:border-blue-800/30"
          >
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-blue-400/50" />
            <p className="text-muted-foreground">
              Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ!
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment: any, index: number) => (
              <motion.div
                key={comment.comment_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <CommentItem
                  comment={comment}
                  onDelete={fetchComments}
                  onUpdate={fetchComments}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
