/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Plus,
  BookOpen,
  Clock,
  Archive,
  BookOpenText,
  Eye,
  Heart,
  MessageCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Image from "next/image";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useLoading } from "@/providers/loading-provider";
import { motion } from "framer-motion";

interface Story {
  story_id: number;
  title: string;
  cover_image: string | null;
  main_category: string;
  status: "draft" | "published" | "archived";
  view_count: number;
  favorite_count: number;
  updated_at: string;
}

export default function StoriesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { startLoading } = useLoading();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoadingStories, setIsLoadingStories] = useState(true);

  const fetchStories = async () => {
    try {
      const response = await fetch("/api/stories");
      const data = await response.json();

      if (response.ok) {
        setStories(data.stories);
      } else {
        toast.error(data.error || "Không thể tải danh sách truyện");
      }
    } catch (error) {
      toast.error("Đã có lỗi xảy ra khi tải danh sách truyện");
    } finally {
      setIsLoadingStories(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchStories();
    } else if (status === "unauthenticated") {
      setIsLoadingStories(false);
    }
  }, [session, status]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "published":
        return <BookOpen className="w-4 h-4 text-green-500" />;
      case "archived":
        return <Archive className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "draft":
        return "Bản nháp";
      case "published":
        return "Đã xuất bản";
      case "archived":
        return "Đã lưu trữ";
      default:
        return status;
    }
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
      icon: BookOpen,
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

      <main className="flex-1 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-8 sm:mb-12"
          >
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Truyện của tôi
            </h1>
            {session?.user && (
              <Button
                onClick={() => {
                  startLoading("/stories/create");
                  router.push("/stories/create");
                }}
                className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-4 h-4 mr-3" />
                Tạo truyện mới
              </Button>
            )}
          </motion.div>

          {isLoadingStories ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: item * 0.1 }}
                >
                  <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 overflow-hidden h-[200px] sm:h-[220px]">
                    <div className="relative w-full h-[120px] sm:h-[130px]">
                      <Skeleton height="100%" className="rounded-t-3xl" />
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <Skeleton
                          width="70%"
                          height={20}
                          className="rounded-full"
                        />
                        <Skeleton
                          width={60}
                          height={16}
                          className="rounded-full"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton
                          width={80}
                          height={20}
                          className="rounded-full"
                        />
                        <div className="ml-auto flex gap-2">
                          <Skeleton
                            width={40}
                            height={16}
                            className="rounded-full"
                          />
                          <Skeleton
                            width={40}
                            height={16}
                            className="rounded-full"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Skeleton
                          width="48%"
                          height={32}
                          className="rounded-2xl"
                        />
                        <Skeleton
                          width="48%"
                          height={32}
                          className="rounded-2xl"
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : !session?.user ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center py-8 sm:py-12"
            >
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-8 max-w-md mx-auto">
                <BookOpenText className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 text-blue-400/50" />
                <h2 className="text-xl sm:text-2xl font-semibold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Vui lòng đăng nhập để bắt đầu
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground px-4 mb-6">
                  Bạn cần đăng nhập để xem và tạo truyện của mình
                </p>
              </div>
            </motion.div>
          ) : stories.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center py-8 sm:py-12"
            >
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-8 max-w-md mx-auto">
                <BookOpenText className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 text-blue-400/50" />
                <h2 className="text-xl sm:text-2xl font-semibold mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Bạn chưa có truyện nào
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground px-4">
                  Hãy bắt đầu hành trình sáng tạo bằng việc tạo truyện đầu tiên
                  của bạn
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {stories.map((story, index) => (
                <motion.div
                  key={story.story_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group cursor-pointer"
                  onClick={() => {
                    startLoading(`/stories/${story.story_id}`);
                    router.push(`/stories/${story.story_id}`);
                  }}
                >
                  <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 overflow-hidden h-[200px] sm:h-[220px] hover:shadow-2xl transition-all duration-500">
                    {/* Cover Image with Gradient Overlay */}
                    <div className="relative w-full h-[120px] sm:h-[130px] overflow-hidden">
                      {story.cover_image ? (
                        <Image
                          src={story.cover_image}
                          alt={story.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 flex items-center justify-center">
                          <BookOpenText className="w-12 h-12 text-blue-400/50" />
                        </div>
                      )}

                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        <div
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                            story.status === "published"
                              ? "bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/30"
                              : story.status === "draft"
                              ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-500/30"
                              : "bg-gray-500/20 text-gray-700 dark:text-gray-300 border border-gray-500/30"
                          }`}
                        >
                          {getStatusIcon(story.status)}
                          <span className="hidden sm:inline">
                            {getStatusText(story.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-3">
                      {/* Title and Category */}
                      <div className="space-y-2">
                        <CardTitle className="text-sm sm:text-base font-semibold line-clamp-2 leading-tight">
                          {story.title}
                        </CardTitle>
                        <div className="flex items-center justify-between">
                          <span className="text-xs bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-medium truncate max-w-[120px]">
                            {story.main_category}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {story.view_count}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {story.favorite_count || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs h-8 bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 border border-white/20 dark:border-slate-600/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            startLoading(`/stories/${story.story_id}/edit`);
                            router.push(`/stories/${story.story_id}/edit`);
                          }}
                        >
                          Chỉnh sửa
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 text-xs h-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            startLoading(`/stories/${story.story_id}`);
                            router.push(`/stories/${story.story_id}`);
                          }}
                        >
                          Xem truyện
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
