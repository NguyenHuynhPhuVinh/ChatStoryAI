/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

export function StoryFavoriteButton({
  storyId,
  favoriteCount,
}: {
  storyId: string;
  favoriteCount: number;
}) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [count, setCount] = useState(favoriteCount);

  useEffect(() => {
    fetchFavoriteStatus();
  }, [storyId]);

  const fetchFavoriteStatus = async () => {
    try {
      const res = await fetch(`/api/stories/${storyId}/favorites`);
      const data = await res.json();
      setIsFavorited(data.isFavorited);
    } catch (error) {
      console.error("Lỗi khi kiểm tra trạng thái yêu thích:", error);
    }
  };

  const toggleFavorite = async () => {
    try {
      const res = await fetch(`/api/stories/${storyId}/favorites`, {
        method: "POST",
      });
      const data = await res.json();
      setIsFavorited(!isFavorited);
      setCount((prev) => (isFavorited ? prev - 1 : prev + 1));
      toast.success(data.message);
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFavorite}
          className={`relative overflow-hidden backdrop-blur-sm border border-white/20 dark:border-slate-700/50 transition-all duration-300 ${
            isFavorited
              ? "bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 text-red-500"
              : "bg-white/50 dark:bg-slate-800/50 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:text-red-500"
          }`}
        >
          <Heart
            className={`w-5 h-5 transition-all duration-300 ${
              isFavorited ? "fill-current" : ""
            }`}
          />
          {isFavorited && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-400/20 rounded-md"
            />
          )}
        </Button>
      </motion.div>
      {count > 0 && (
        <span className="text-sm font-medium text-muted-foreground">
          {count}
        </span>
      )}
    </div>
  );
}
