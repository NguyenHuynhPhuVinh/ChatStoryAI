"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  BookOpenText,
  Clock,
  Eye,
  Heart,
  Check,
  MoreVertical,
  BookOpen,
  BookOpenCheck,
  MessageCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { StoryFavoriteButton } from "@/components/story/story-favorite-button";
import { StoryComments } from "@/components/story/story-comments";
import { StoryBookmarkButton } from "@/components/story/story-bookmark-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import { useLoading } from "@/providers/loading-provider";
import { motion } from "framer-motion";

interface Story {
  story_id: number;
  title: string;
  description: string;
  cover_image: string | null;
  main_category: string;
  view_count: number;
  updated_at: string;
  tags: string[];
  favorite_count: number;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  author_avatar: string | null;
  author_name: string;
  has_badge: boolean;
}

interface Chapter {
  chapter_id: number;
  title: string;
  status: string;
  publish_order: number;
  is_read?: boolean;
}

export default function StoryDetailContent({ storyId }: { storyId: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { startLoading } = useLoading();

  useEffect(() => {
    const fetchStoryData = async () => {
      try {
        const [storyRes, chaptersRes] = await Promise.all([
          fetch(`/api/library/${storyId}`),
          fetch(`/api/library/${storyId}/chapters`),
        ]);

        const [storyData, chaptersData] = await Promise.all([
          storyRes.json(),
          chaptersRes.json(),
        ]);

        if (storyRes.ok) setStory(storyData.story);
        if (chaptersRes.ok) {
          const processedChapters = chaptersData.chapters.map(
            (chapter: Chapter) => ({
              ...chapter,
              is_read: session ? chapter.is_read : false,
            })
          );
          setChapters(processedChapters);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoryData();
  }, [storyId, session]);

  const handleMarkAsRead = async (chapterId: number) => {
    try {
      const response = await fetch(
        `/api/library/${storyId}/chapters/${chapterId}/read`,
        {
          method: "POST",
        }
      );
      if (response.ok) {
        setChapters(
          chapters.map((ch) =>
            ch.chapter_id === chapterId ? { ...ch, is_read: true } : ch
          )
        );
      }
    } catch (error) {
      console.error("Lỗi khi đánh dấu chương đã đọc:", error);
    }
  };

  const handleMarkAsUnread = async (chapterId: number) => {
    try {
      const response = await fetch(
        `/api/library/${storyId}/chapters/${chapterId}/read`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        setChapters(
          chapters.map((ch) =>
            ch.chapter_id === chapterId ? { ...ch, is_read: false } : ch
          )
        );
      }
    } catch (error) {
      console.error("Lỗi khi bỏ đánh dấu chương đã đọc:", error);
    }
  };

  const handleContinueReading = () => {
    const firstUnreadChapter = chapters.find((chapter) => !chapter.is_read);
    if (firstUnreadChapter) {
      startLoading(
        `/library/${storyId}/chapters/${firstUnreadChapter.chapter_id}`
      );
      router.push(
        `/library/${storyId}/chapters/${firstUnreadChapter.chapter_id}`
      );
    }
  };

  const handleStartReading = () => {
    const firstChapter = chapters[0];
    if (firstChapter) {
      startLoading(`/library/${storyId}/chapters/${firstChapter.chapter_id}`);
      router.push(`/library/${storyId}/chapters/${firstChapter.chapter_id}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Đánh dấu từng chương chưa đọc
      const unreadChapters = chapters.filter((ch) => !ch.is_read);
      await Promise.all(
        unreadChapters.map((chapter) =>
          fetch(`/api/library/${storyId}/chapters/${chapter.chapter_id}/read`, {
            method: "POST",
          })
        )
      );

      // Cập nhật state local
      setChapters(chapters.map((ch) => ({ ...ch, is_read: true })));

      toast.success("Đã đánh dấu tất cả chương là đã đọc");
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã đọc hết:", error);
      toast.error("Có lỗi xảy ra khi đánh dấu đã đọc");
    }
  };

  const handleCategoryClick = (category: string) => {
    startLoading(`/library/search?category=${encodeURIComponent(category)}`);
    router.push(`/library/search?category=${encodeURIComponent(category)}`);
  };

  const handleTagClick = (tag: string) => {
    startLoading(`/library/search?tags=${encodeURIComponent(tag)}`);
    router.push(`/library/search?tags=${encodeURIComponent(tag)}`);
  };

  // Floating elements for background animation
  const floatingElements = [
    {
      icon: MessageCircle,
      delay: 0,
      position: "top-20 left-10",
      color: "text-blue-400",
    },
    {
      icon: Sparkles,
      delay: 1,
      position: "top-32 right-20",
      color: "text-purple-400",
    },
    {
      icon: Zap,
      delay: 2,
      position: "bottom-40 left-20",
      color: "text-yellow-400",
    },
    {
      icon: BookOpenText,
      delay: 3,
      position: "bottom-20 right-10",
      color: "text-green-400",
    },
  ];

  const morphingShapes = [
    { id: 1, x: "10%", y: "20%", size: 60, color: "bg-blue-400/10" },
    { id: 2, x: "80%", y: "30%", size: 80, color: "bg-purple-400/10" },
    { id: 3, x: "20%", y: "70%", size: 100, color: "bg-pink-400/10" },
    { id: 4, x: "70%", y: "80%", size: 70, color: "bg-green-400/10" },
  ];

  if (isLoading || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 relative overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20" />

        {/* Morphing Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {morphingShapes.map((shape) => (
            <motion.div
              key={shape.id}
              className={`absolute ${shape.color} rounded-full blur-xl`}
              style={{
                left: shape.x,
                top: shape.y,
                width: shape.size,
                height: shape.size,
              }}
              animate={{
                scale: [1, 1.5, 0.8, 1.2, 1],
                rotate: [0, 180, 360],
                x: [0, 50, -30, 20, 0],
                y: [0, -30, 40, -20, 0],
              }}
              transition={{
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Interactive Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {floatingElements.map((element, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0, rotate: 0 }}
              animate={{
                opacity: [0, 0.6, 0.3, 0.7, 0.2],
                scale: [0, 1.2, 0.7, 1, 0.8],
                rotate: [0, 360, 180, 270, 360],
                x: [0, 30, -20, 15, 0],
                y: [0, -40, 20, -15, 0],
              }}
              transition={{
                duration: 6 + Math.random() * 3,
                delay: element.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`absolute ${element.position} ${element.color}/30 dark:${element.color}/15`}
            >
              <element.icon size={25 + Math.random() * 15} />
            </motion.div>
          ))}
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="grid md:grid-cols-[300px_1fr] gap-8">
            {/* Skeleton cho cột trái - ảnh bìa */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-slate-700/50">
                <Skeleton height="100%" />
              </div>
            </motion.div>

            {/* Skeleton cho cột phải - thông tin truyện */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6">
                <Skeleton
                  height={32}
                  width="80%"
                  className="mb-2 rounded-full"
                />
                <Skeleton count={3} className="mb-1 rounded-full" />
              </div>

              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Skeleton width={100} height={28} className="rounded-full" />
                  <Skeleton width={120} height={24} className="rounded-full" />
                </div>

                <div className="flex flex-wrap gap-2">
                  {Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <Skeleton
                        key={index}
                        width={80}
                        height={28}
                        className="rounded-full"
                      />
                    ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Skeleton cho danh sách chương */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8"
          >
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6">
              <Skeleton height={32} width={200} className="mb-4 rounded-full" />
              <div className="space-y-3">
                {Array(5)
                  .fill(0)
                  .map((_, index) => (
                    <Skeleton key={index} height={60} className="rounded-2xl" />
                  ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20" />

      {/* Morphing Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {morphingShapes.map((shape) => (
          <motion.div
            key={shape.id}
            className={`absolute ${shape.color} rounded-full blur-xl`}
            style={{
              left: shape.x,
              top: shape.y,
              width: shape.size,
              height: shape.size,
            }}
            animate={{
              scale: [1, 1.5, 0.8, 1.2, 1],
              rotate: [0, 180, 360],
              x: [0, 50, -30, 20, 0],
              y: [0, -30, 40, -20, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Interactive Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingElements.map((element, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0, rotate: 0 }}
            animate={{
              opacity: [0, 0.6, 0.3, 0.7, 0.2],
              scale: [0, 1.2, 0.7, 1, 0.8],
              rotate: [0, 360, 180, 270, 360],
              x: [0, 30, -20, 15, 0],
              y: [0, -40, 20, -15, 0],
            }}
            transition={{
              duration: 6 + Math.random() * 3,
              delay: element.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`absolute ${element.position} ${element.color}/30 dark:${element.color}/15`}
          >
            <element.icon size={25 + Math.random() * 15} />
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid md:grid-cols-[300px_1fr] gap-8">
          {/* Thông tin truyện - cột trái */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-slate-700/50">
              {story.cover_image ? (
                <Image
                  src={story.cover_image}
                  alt={story.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 300px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 flex items-center justify-center">
                  <BookOpenText className="w-16 h-16 text-blue-400/50" />
                </div>
              )}
            </div>
          </motion.div>

          {/* Thông tin truyện - cột phải */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {story.title}
                </h1>
                {session && (
                  <div className="flex items-center gap-2">
                    <StoryBookmarkButton storyId={storyId} />
                    <StoryFavoriteButton
                      storyId={storyId}
                      favoriteCount={story.favorite_count}
                    />
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="relative">
                  {story.has_badge && (
                    <div
                      className={clsx(
                        "absolute -inset-[3px] rounded-full",
                        "bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500",
                        "animate-gradient-xy",
                        "opacity-90"
                      )}
                    />
                  )}
                  <div className="relative w-8 h-8">
                    <Image
                      src={story.author_avatar || "/default-user.webp"}
                      alt="Author avatar"
                      fill
                      sizes="32px"
                      className="rounded-full object-cover"
                      priority
                    />
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {story.author_name}
                </span>
              </div>
            </div>

            <div>
              <p className="text-muted-foreground leading-relaxed">
                {story.description}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span
                  className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium hover:from-blue-600/20 hover:to-purple-600/20 cursor-pointer transition-all duration-300 border border-blue-200/50 dark:border-blue-700/50"
                  onClick={() => handleCategoryClick(story.main_category)}
                >
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  {story.main_category}
                </span>
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-blue-500" />
                  {story.view_count} lượt xem
                </span>
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-red-500" />
                  {story.favorite_count} lượt thích
                </span>
              </div>

              {story.tags && story.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {story.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-white/50 dark:bg-slate-700/50 text-muted-foreground hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 px-3 py-1.5 rounded-full text-sm cursor-pointer border border-white/20 dark:border-slate-600/20 backdrop-blur-sm"
                      onClick={() => handleTagClick(tag)}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Thêm nút đọc từ đầu/đọc tiếp */}
            {session && (
              <div className="flex gap-3">
                <Button
                  onClick={handleStartReading}
                  disabled={chapters.length === 0}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <BookOpen className="w-4 h-4" />
                  Đọc từ đầu
                </Button>
                <Button
                  onClick={handleContinueReading}
                  disabled={!chapters.some((chapter) => !chapter.is_read)}
                  variant="outline"
                  className="flex items-center gap-2 border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300"
                >
                  <BookOpenCheck className="w-4 h-4" />
                  Đọc tiếp
                </Button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Danh sách chương */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8"
        >
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Danh sách chương
              </h2>
              {session && (
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300"
                  onClick={handleMarkAllAsRead}
                  disabled={
                    chapters.length === 0 || chapters.every((ch) => ch.is_read)
                  }
                >
                  <BookOpenCheck className="w-4 h-4" />
                  Đánh dấu đã đọc hết
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {chapters.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-8">
                    <Clock className="w-16 h-16 mx-auto mb-4 text-blue-400/50" />
                    <p className="text-muted-foreground">
                      Chưa có chương nào được xuất bản
                    </p>
                  </div>
                </div>
              ) : (
                chapters.map((chapter, index) => (
                  <motion.div
                    key={chapter.chapter_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-lg transition-all duration-300 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-white/20 dark:border-slate-600/20 hover:border-blue-300/50 dark:hover:border-blue-600/50"
                      onClick={() => {
                        startLoading(
                          `/library/${storyId}/chapters/${chapter.chapter_id}`
                        );
                        router.push(
                          `/library/${storyId}/chapters/${chapter.chapter_id}`
                        );
                      }}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {chapter.title}
                          </h3>
                          <div
                            className="flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {session && chapter.is_read ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : null}
                            {session && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {!chapter.is_read ? (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleMarkAsRead(chapter.chapter_id)
                                      }
                                    >
                                      Đánh dấu đã đọc
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleMarkAsUnread(chapter.chapter_id)
                                      }
                                    >
                                      Bỏ đánh dấu đã đọc
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* Phần bình luận */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8"
        >
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Bình luận
            </h2>
            <StoryComments storyId={storyId} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
