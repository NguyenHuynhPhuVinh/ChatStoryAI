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
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
                <Card
                  key={item}
                  className="flex flex-row h-[140px] sm:h-[160px] overflow-hidden"
                >
                  <div className="relative w-[105px] sm:w-[120px] h-full flex-shrink-0">
                    <Skeleton height="100%" style={{ aspectRatio: "3/4" }} />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 p-2 sm:p-4">
                    <CardHeader className="p-0 space-y-1.5 sm:space-y-3">
                      <div className="flex items-start gap-1.5 sm:gap-2">
                        <div className="min-w-0 flex-1">
                          <Skeleton width="80%" height={20} />
                        </div>
                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 mt-0.5">
                          <Skeleton width={60} height={16} />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                        <Skeleton width={80} height={20} />
                        <div className="ml-auto">
                          <Skeleton width={60} height={16} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardFooter className="flex flex-row justify-between gap-1.5 sm:gap-2 p-0 mt-auto pt-1.5 sm:pt-3">
                      <Skeleton width="48%" height={32} />
                      <Skeleton width="48%" height={32} />
                    </CardFooter>
                  </div>
                </Card>
              ))}
            </div>
          ) : !session?.user ? (
            <div className="text-center py-8 sm:py-12">
              <BookOpenText className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 text-muted-foreground/30" />
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">
                Vui lòng đăng nhập để bắt đầu
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground px-4 mb-6">
                Bạn cần đăng nhập để xem và tạo truyện của mình
              </p>
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <BookOpenText className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 text-muted-foreground/30" />
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">
                Bạn chưa có truyện nào
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground px-4">
                Hãy bắt đầu hành trình sáng tạo bằng việc tạo truyện đầu tiên
                của bạn
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {stories.map((story) => (
                <Card
                  key={story.story_id}
                  className="flex flex-row h-[140px] sm:h-[160px] overflow-hidden"
                >
                  <div className="relative w-[105px] sm:w-[120px] h-full flex-shrink-0">
                    {story.cover_image ? (
                      <Image
                        src={story.cover_image}
                        alt={story.title}
                        fill
                        sizes="(max-width: 640px) 105px, 120px"
                        className="object-cover"
                        style={{ aspectRatio: "3/4" }}
                      />
                    ) : (
                      <div
                        className="w-full h-full bg-muted flex items-center justify-center"
                        style={{ aspectRatio: "3/4" }}
                      >
                        <BookOpenText className="w-5 sm:w-6 h-5 sm:h-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0 p-2 sm:p-4">
                    <CardHeader className="p-0 space-y-1.5 sm:space-y-3">
                      <div className="flex items-start gap-1.5 sm:gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-xs sm:text-base truncate">
                            {story.title}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 mt-0.5">
                          {getStatusIcon(story.status)}
                          <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                            {getStatusText(story.status)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                        <span className="text-[10px] sm:text-xs bg-primary/20 text-primary px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium truncate max-w-[100px] sm:max-w-[130px]">
                          {story.main_category}
                        </span>
                        <div className="flex items-center gap-2 ml-auto shrink-0">
                          <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                            <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            {story.view_count}
                          </span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                            <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            {story.favorite_count || 0}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardFooter className="flex flex-row justify-between gap-1.5 sm:gap-2 p-0 mt-auto pt-1.5 sm:pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-[10px] sm:text-xs h-6 sm:h-8 px-1.5 sm:px-3"
                        onClick={() => {
                          startLoading(`/stories/${story.story_id}/edit`);
                          router.push(`/stories/${story.story_id}/edit`);
                        }}
                      >
                        Chỉnh sửa
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-[10px] sm:text-xs h-6 sm:h-8 px-1.5 sm:px-3"
                        onClick={() => {
                          startLoading(`/stories/${story.story_id}`);
                          router.push(`/stories/${story.story_id}`);
                        }}
                      >
                        Xem truyện
                      </Button>
                    </CardFooter>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
