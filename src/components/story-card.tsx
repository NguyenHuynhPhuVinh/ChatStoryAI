/* eslint-disable @typescript-eslint/no-unused-vars */
import Image from "next/image";
import { useRouter } from "next/navigation";

import { BookOpenText, Eye, Heart, Sparkles, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useLoading } from "@/providers/loading-provider";
import { motion } from "framer-motion";

interface StoryCardProps {
  story: {
    story_id: number;
    title: string;
    description: string;
    cover_image: string | null;
    main_category: string;
    view_count: number;
    favorite_count: number;
    updated_at: string;
    relevance_score?: number;
    match_reason?: string;
    tags?: string[];
  };
  onClick?: () => void;
  variant?: "default" | "search";
  showRelevance?: boolean;
}

export function StoryCard({
  story,
  onClick,
  variant = "default",
  showRelevance = false,
}: StoryCardProps) {
  const router = useRouter();
  const { startLoading } = useLoading();
  const [favoriteCount, setFavoriteCount] = useState(story.favorite_count);

  useEffect(() => {
    fetchFavoriteCount();
  }, [story.story_id]);

  const fetchFavoriteCount = async () => {
    try {
      const res = await fetch(`/api/stories/${story.story_id}/favorites/count`);
      const data = await res.json();
      setFavoriteCount(data.count);
    } catch (error) {
      console.error("Lỗi khi lấy số lượt thích:", error);
    }
  };

  const handleClick = async () => {
    if (onClick) {
      onClick();
      return;
    }
    try {
      // Gọi API để tăng lượt xem
      await fetch(`/api/library/${story.story_id}/view`, {
        method: "POST",
      });
      startLoading(`/library/${story.story_id}`);
      // Chuyển hướng đến trang chi tiết
      router.push(`/library/${story.story_id}`);
    } catch (error) {
      console.error("Lỗi khi cập nhật lượt xem:", error);
      // Vẫn chuyển hướng ngay cả khi không cập nhật được lượt xem
      startLoading(`/library/${story.story_id}`);
      router.push(`/library/${story.story_id}`);
    }
  };

  if (variant === "search") {
    return (
      <div
        onClick={handleClick}
        className="flex gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer"
      >
        <div className="relative aspect-[3/4] w-[80px] rounded-md overflow-hidden">
          {story.cover_image ? (
            <Image
              src={story.cover_image}
              alt={story.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <BookOpenText className="w-6 h-6 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{story.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {story.description}
          </p>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{story.view_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{story.favorite_count}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 overflow-hidden hover:shadow-2xl transition-all duration-500">
        {/* Cover Image with Gradient Overlay */}
        <div className="relative w-full aspect-[3/4] overflow-hidden">
          {story.cover_image ? (
            <Image
              src={story.cover_image}
              alt={story.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 flex items-center justify-center">
              <BookOpenText className="w-16 h-16 text-blue-400/50" />
            </div>
          )}

          {/* Floating Category Badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm">
              <Sparkles className="w-3 h-3 inline mr-1" />
              {story.main_category}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-lg leading-tight line-clamp-2 bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
              {story.title}
            </h3>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {story.description}
          </p>

          {/* Stats Row */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{story.view_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="font-medium">{favoriteCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>
                {new Date(story.updated_at).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
