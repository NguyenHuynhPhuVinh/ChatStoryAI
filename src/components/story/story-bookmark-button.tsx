/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function StoryBookmarkButton({ storyId }: { storyId: string }) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    fetchBookmarkStatus();
  }, [storyId]);

  const fetchBookmarkStatus = async () => {
    try {
      const res = await fetch(`/api/stories/${storyId}/bookmarks`);
      const data = await res.json();
      setIsBookmarked(data.isBookmarked);
    } catch (error) {
      console.error("Lỗi khi kiểm tra trạng thái lưu trữ:", error);
    }
  };

  const toggleBookmark = async () => {
    try {
      const res = await fetch(`/api/stories/${storyId}/bookmarks`, {
        method: "POST",
      });
      const data = await res.json();
      setIsBookmarked(!isBookmarked);
      toast.success(data.message);
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleBookmark}
        className={`relative overflow-hidden backdrop-blur-sm border border-white/20 dark:border-slate-700/50 transition-all duration-300 ${
          isBookmarked
            ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 text-blue-500"
            : "bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:text-blue-500"
        }`}
      >
        <Bookmark
          className={`w-5 h-5 transition-all duration-300 ${
            isBookmarked ? "fill-current" : ""
          }`}
        />
        {isBookmarked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-md"
          />
        )}
      </Button>
    </motion.div>
  );
}
