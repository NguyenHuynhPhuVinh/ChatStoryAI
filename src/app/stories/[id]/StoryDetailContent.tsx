/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  BookOpen,
  Clock,
  User,
  ChevronLeft,
  Eye,
  Heart,
  MessageCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useLoading } from "@/providers/loading-provider";
import { motion } from "framer-motion";

interface Character {
  character_id: number;
  name: string;
  avatar_image: string;
  description: string;
  role: "main" | "supporting";
}

interface Chapter {
  chapter_id: number;
  title: string;
  order_number: number;
  status: "draft" | "published";
  created_at: string;
  publish_order?: number;
}

interface Story {
  story_id: number;
  title: string;
  description: string;
  cover_image: string | null;
  main_category: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  view_count: number;
  favorite_count: number;
}

interface Outline {
  outline_id: number;
  title: string;
  description: string;
  order_number: number;
}

export default function StoryDetailContent({ storyId }: { storyId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startLoading } = useLoading();
  const { data: session } = useSession();
  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [outlines, setOutlines] = useState<Outline[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lấy cả tab và status từ URL
  const currentTab = searchParams.get("tab") || "chapters";
  const currentStatus = searchParams.get("status") || "published";

  useEffect(() => {
    const fetchStoryData = async () => {
      try {
        // Fetch story details
        const storyResponse = await fetch(`/api/stories/${storyId}`);
        const storyData = await storyResponse.json();

        if (storyResponse.ok) {
          setStory(storyData.story);
        } else {
          toast.error("Không thể tải thông tin truyện");
        }

        // Fetch chapters
        const chaptersResponse = await fetch(
          `/api/stories/${storyId}/chapters`
        );
        const chaptersData = await chaptersResponse.json();

        if (chaptersResponse.ok) {
          setChapters(chaptersData.chapters);
        }

        // Fetch characters
        const charactersResponse = await fetch(
          `/api/stories/${storyId}/characters`
        );
        const charactersData = await charactersResponse.json();

        if (charactersResponse.ok) {
          setCharacters(charactersData.characters);
        }

        // Fetch outlines
        const outlinesResponse = await fetch(
          `/api/stories/${storyId}/outlines`
        );
        const outlinesData = await outlinesResponse.json();

        if (outlinesResponse.ok) {
          setOutlines(outlinesData.outlines);
        }
      } catch (error) {
        toast.error("Đã có lỗi xảy ra");
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchStoryData();
    }
  }, [session, storyId]);

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

        <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton width={150} height={36} className="rounded-2xl" />
          </div>

          <div className="grid md:grid-cols-[300px_1fr] gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-4">
                <Skeleton height={400} className="aspect-[3/4] rounded-2xl" />
              </div>
              <Skeleton height={36} className="rounded-2xl" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex-1 min-w-0"
            >
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6">
                <Skeleton
                  height={40}
                  width="80%"
                  className="mb-4 rounded-full"
                />
                <div className="flex flex-wrap gap-2 mb-4">
                  <Skeleton width={100} height={24} className="rounded-full" />
                  <Skeleton width={80} height={24} className="rounded-full" />
                  <Skeleton width={120} height={24} className="rounded-full" />
                </div>
                <Skeleton count={3} className="mb-1 rounded-full" />
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <Skeleton width={300} height={40} className="rounded-2xl" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6">
              <div className="mb-4 flex justify-between">
                <Skeleton width={200} height={32} className="rounded-full" />
                <Skeleton width={150} height={36} className="rounded-2xl" />
              </div>
              <Skeleton width={250} height={40} className="mb-4 rounded-2xl" />
              <div className="grid gap-4">
                <Skeleton height={100} className="rounded-2xl" />
                <Skeleton height={100} className="rounded-2xl" />
                <Skeleton height={100} className="rounded-2xl" />
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

      <div className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="outline"
            onClick={() => {
              startLoading("/stories");
              router.push("/stories");
            }}
            className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300"
          >
            <ChevronLeft className="w-4 h-4" />
            Danh sách truyện
          </Button>
        </motion.div>

        <div className="grid md:grid-cols-[350px_1fr] gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Cover Image Card */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6 group">
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 shadow-inner">
                {story.cover_image ? (
                  <Image
                    src={story.cover_image}
                    alt={story.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 350px"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <motion.div
                      animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <BookOpen className="w-20 h-20 text-blue-400/50" />
                    </motion.div>
                  </div>
                )}

                {/* Floating Status Badge */}
                <div className="absolute top-3 right-3">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                    className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
                      story.status === "published"
                        ? "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30"
                        : story.status === "draft"
                        ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30"
                        : "bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30"
                    }`}
                  >
                    {story.status === "published"
                      ? "✨ Đã xuất bản"
                      : story.status === "draft"
                      ? "📝 Bản nháp"
                      : "📦 Đã lưu trữ"}
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => {
                  startLoading(`/stories/${storyId}/edit`);
                  router.push(`/stories/${storyId}/edit`);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-12 rounded-2xl font-medium"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Chỉnh sửa truyện
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  startLoading(`/library/${storyId}`);
                  router.push(`/library/${storyId}`);
                }}
                className="w-full bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 border border-white/20 dark:border-slate-600/20 h-12 rounded-2xl font-medium"
              >
                <Eye className="w-4 h-4 mr-2" />
                Xem như độc giả
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex-1 min-w-0"
          >
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-8 space-y-6">
              {/* Title Section */}
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl font-bold leading-tight bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {story.title}
                </h1>

                {/* Category and Tags */}
                <div className="flex flex-wrap gap-3">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 text-sm font-medium shadow-lg border-0">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {story.main_category}
                    </Badge>
                  </motion.div>

                  {story.tags &&
                    story.tags.map((tag, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                      >
                        <Badge
                          variant="outline"
                          className="bg-white/50 dark:bg-slate-700/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-3 py-1 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          {tag}
                        </Badge>
                      </motion.div>
                    ))}
                </div>
              </div>

              {/* Stats Section */}
              <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 dark:from-blue-900/10 dark:via-purple-900/10 dark:to-indigo-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30">
                <div className="grid grid-cols-2 gap-6">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-center space-y-2"
                  >
                    <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                      <Eye className="w-5 h-5" />
                      <span className="text-2xl font-bold">
                        {story.view_count || 0}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Lượt xem
                    </p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-center space-y-2"
                  >
                    <div className="flex items-center justify-center gap-2 text-red-500 dark:text-red-400">
                      <Heart className="w-5 h-5" />
                      <span className="text-2xl font-bold">
                        {story.favorite_count || 0}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">
                      Lượt thích
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  Mô tả truyện
                </h3>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-muted-foreground leading-relaxed">
                    {story.description}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Tabs
            defaultValue={currentTab}
            className="w-full"
            onValueChange={(value) => {
              // Khi chuyển tab, giữ nguyên status nếu đang ở tab chapters
              if (value === "chapters") {
                //startLoading(`/stories/${storyId}?tab=${value}&status=${currentStatus}`)
                router.push(
                  `/stories/${storyId}?tab=${value}&status=${currentStatus}`,
                  { scroll: false }
                );
              } else {
                //startLoading(`/stories/${storyId}?tab=${value}`)
                router.push(`/stories/${storyId}?tab=${value}`, {
                  scroll: false,
                });
              }
            }}
          >
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-2 mb-8">
              <TabsList className="bg-transparent w-full h-auto p-0 space-x-2">
                <TabsTrigger
                  value="chapters"
                  className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl h-12 font-medium transition-all duration-300"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Danh sách chương
                </TabsTrigger>
                <TabsTrigger
                  value="characters"
                  className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl h-12 font-medium transition-all duration-300"
                >
                  <User className="w-4 h-4 mr-2" />
                  Nhân vật
                </TabsTrigger>
                <TabsTrigger
                  value="outlines"
                  className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl h-12 font-medium transition-all duration-300"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Đại cương
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="chapters">
              <Tabs
                defaultValue={currentStatus}
                className="w-full"
                onValueChange={(value) => {
                  //startLoading(`/stories/${storyId}?tab=chapters&status=${value}`)
                  router.push(
                    `/stories/${storyId}?tab=chapters&status=${value}`,
                    {
                      scroll: false,
                    }
                  );
                }}
              >
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      Các chương truyện
                    </h2>
                    <p className="text-muted-foreground">
                      Quản lý và tổ chức các chương trong truyện của bạn
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      startLoading(`/stories/${storyId}/chapters/create`);
                      router.push(`/stories/${storyId}/chapters/create`);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-12 px-6 rounded-2xl font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm chương mới
                  </Button>
                </div>

                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-2 mb-6">
                  <TabsList className="bg-transparent w-full h-auto p-0 space-x-2">
                    <TabsTrigger
                      value="published"
                      className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl h-10 font-medium transition-all duration-300"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Đã xuất bản
                    </TabsTrigger>
                    <TabsTrigger
                      value="draft"
                      className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-600 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl h-10 font-medium transition-all duration-300"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Bản nháp
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="published">
                  <div className="grid gap-6">
                    {chapters.filter((c) => c.status === "published").length ===
                    0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center py-12"
                      >
                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-8 max-w-md mx-auto">
                          <BookOpen className="w-16 h-16 mx-auto mb-4 text-green-400/50" />
                          <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            Chưa có chương nào được xuất bản
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Hãy tạo chương đầu tiên và xuất bản để độc giả có
                            thể đọc
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      chapters
                        .filter((c) => c.status === "published")
                        .sort(
                          (a, b) =>
                            (a.publish_order || 0) - (b.publish_order || 0)
                        )
                        .map((chapter, index) => (
                          <motion.div
                            key={chapter.chapter_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            whileHover={{ y: -4 }}
                          >
                            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 overflow-hidden group hover:shadow-2xl transition-all duration-300">
                              <CardHeader className="p-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/10 dark:via-emerald-900/10 dark:to-teal-900/10">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <CardTitle className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                                      {chapter.title}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Chương{" "}
                                      {chapter.publish_order || index + 1}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 bg-green-500/20 text-green-700 dark:text-green-300 px-3 py-1 rounded-full border border-green-500/30">
                                    <BookOpen className="w-4 h-4" />
                                    <span className="text-sm font-medium whitespace-nowrap">
                                      Đã xuất bản
                                    </span>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardFooter className="flex gap-3 p-6">
                                <Button
                                  variant="outline"
                                  className="flex-1 bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 border border-white/20 dark:border-slate-600/20 h-10 rounded-2xl font-medium"
                                  onClick={() => {
                                    startLoading(
                                      `/stories/${storyId}/chapters/${chapter.chapter_id}/edit`
                                    );
                                    router.push(
                                      `/stories/${storyId}/chapters/${chapter.chapter_id}/edit`
                                    );
                                  }}
                                >
                                  <Sparkles className="w-4 h-4 mr-2" />
                                  Chỉnh sửa
                                </Button>
                                <Button
                                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg h-10 rounded-2xl font-medium"
                                  onClick={() => {
                                    startLoading(
                                      `/stories/${storyId}/chapters/${chapter.chapter_id}/write`
                                    );
                                    router.push(
                                      `/stories/${storyId}/chapters/${chapter.chapter_id}/write`
                                    );
                                  }}
                                >
                                  <Zap className="w-4 h-4 mr-2" />
                                  Viết truyện
                                </Button>
                              </CardFooter>
                            </Card>
                          </motion.div>
                        ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="draft">
                  <div className="grid gap-4">
                    {chapters.filter((c) => c.status === "draft").length ===
                    0 ? (
                      <div className="text-center py-12">
                        <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                        <p className="text-muted-foreground">
                          Chưa có bản nháp nào
                        </p>
                      </div>
                    ) : (
                      chapters
                        .filter((c) => c.status === "draft")
                        .sort((a, b) => a.order_number - b.order_number)
                        .map((chapter) => (
                          <Card key={chapter.chapter_id}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-xl">
                                  {chapter.title}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-yellow-500" />
                                  <span className="text-sm text-muted-foreground">
                                    Bản nháp
                                  </span>
                                </div>
                              </div>
                            </CardHeader>
                            <CardFooter className="flex gap-2">
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  startLoading(
                                    `/stories/${storyId}/chapters/${chapter.chapter_id}/edit`
                                  );
                                  router.push(
                                    `/stories/${storyId}/chapters/${chapter.chapter_id}/edit`
                                  );
                                }}
                              >
                                Chỉnh sửa
                              </Button>
                              <Button
                                variant="default"
                                className="w-full"
                                onClick={() => {
                                  startLoading(
                                    `/stories/${storyId}/chapters/${chapter.chapter_id}/write`
                                  );
                                  router.push(
                                    `/stories/${storyId}/chapters/${chapter.chapter_id}/write`
                                  );
                                }}
                              >
                                Viết truyện
                              </Button>
                            </CardFooter>
                          </Card>
                        ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="characters">
              <div className="space-y-8">
                <div>
                  <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-2">
                      <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                        Nhân vật chính
                      </h2>
                      <p className="text-muted-foreground">
                        Những nhân vật quan trọng nhất trong câu chuyện
                      </p>
                    </div>
                    {!characters.some((c) => c.role === "main") && (
                      <Button
                        onClick={() => {
                          startLoading(
                            `/stories/${storyId}/characters/create?role=main`
                          );
                          router.push(
                            `/stories/${storyId}/characters/create?role=main`
                          );
                        }}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-12 px-6 rounded-2xl font-medium"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Thêm nhân vật chính
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-6">
                    {characters.filter((c) => c.role === "main").length ===
                    0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center py-12"
                      >
                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-8 max-w-md mx-auto">
                          <User className="w-16 h-16 mx-auto mb-4 text-purple-400/50" />
                          <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Chưa có nhân vật chính nào
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Hãy tạo nhân vật chính để bắt đầu xây dựng câu
                            chuyện
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      characters
                        .filter((c) => c.role === "main")
                        .map((character, index) => (
                          <motion.div
                            key={character.character_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            whileHover={{ y: -4 }}
                          >
                            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 overflow-hidden group hover:shadow-2xl transition-all duration-300">
                              <div className="flex flex-col sm:flex-row items-center sm:items-start p-6">
                                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 via-pink-50 to-red-100 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-red-900/20 flex-shrink-0 border-4 border-white/50 dark:border-slate-700/50 shadow-lg">
                                  {character.avatar_image ? (
                                    <Image
                                      src={character.avatar_image}
                                      alt={character.name}
                                      fill
                                      sizes="80px"
                                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                                      priority
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <User className="w-10 h-10 text-purple-400/70" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-grow min-w-0 mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left w-full sm:w-auto">
                                  <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                                    {character.name}
                                  </CardTitle>
                                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-3 border border-purple-200 dark:border-purple-800">
                                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                      {character.description}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="outline"
                                  className="w-full sm:w-auto mt-4 sm:mt-0 sm:ml-4 bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 border border-white/20 dark:border-slate-600/20 h-10 rounded-2xl font-medium"
                                  onClick={() => {
                                    startLoading(
                                      `/stories/${storyId}/characters/${character.character_id}/edit`
                                    );
                                    router.push(
                                      `/stories/${storyId}/characters/${character.character_id}/edit`
                                    );
                                  }}
                                >
                                  <Sparkles className="w-4 h-4 mr-2" />
                                  Chỉnh sửa
                                </Button>
                              </div>
                            </Card>
                          </motion.div>
                        ))
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-2">
                      <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
                        Nhân vật phụ
                      </h2>
                      <p className="text-muted-foreground">
                        Những nhân vật hỗ trợ và làm phong phú câu chuyện
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        startLoading(
                          `/stories/${storyId}/characters/create?role=supporting`
                        );
                        router.push(
                          `/stories/${storyId}/characters/create?role=supporting`
                        );
                      }}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-12 px-6 rounded-2xl font-medium"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm nhân vật phụ
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {characters.filter((c) => c.role === "supporting")
                      .length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center py-12 col-span-full"
                      >
                        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-8 max-w-md mx-auto">
                          <User className="w-16 h-16 mx-auto mb-4 text-blue-400/50" />
                          <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            Chưa có nhân vật phụ nào
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Thêm nhân vật phụ để làm phong phú câu chuyện của
                            bạn
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      characters
                        .filter((c) => c.role === "supporting")
                        .map((character, index) => (
                          <motion.div
                            key={character.character_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            whileHover={{ y: -4, scale: 1.02 }}
                          >
                            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 overflow-hidden group hover:shadow-2xl transition-all duration-300 h-full">
                              <div className="p-5 space-y-4">
                                <div className="flex items-center space-x-3">
                                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 via-cyan-50 to-teal-100 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-teal-900/20 flex-shrink-0 border-3 border-white/50 dark:border-slate-700/50 shadow-lg">
                                    {character.avatar_image ? (
                                      <Image
                                        src={character.avatar_image}
                                        alt={character.name}
                                        fill
                                        sizes="64px"
                                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                                        priority
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <User className="w-8 h-8 text-blue-400/70" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <CardTitle className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent truncate">
                                      {character.name}
                                    </CardTitle>
                                    <div className="flex items-center gap-1 mt-1">
                                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                        Nhân vật phụ
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-3 border border-blue-200 dark:border-blue-800">
                                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                    {character.description}
                                  </p>
                                </div>

                                <Button
                                  variant="outline"
                                  className="w-full bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 border border-white/20 dark:border-slate-600/20 h-10 rounded-2xl font-medium"
                                  onClick={() => {
                                    startLoading(
                                      `/stories/${storyId}/characters/${character.character_id}/edit`
                                    );
                                    router.push(
                                      `/stories/${storyId}/characters/${character.character_id}/edit`
                                    );
                                  }}
                                >
                                  <Sparkles className="w-4 h-4 mr-2" />
                                  Chỉnh sửa
                                </Button>
                              </div>
                            </Card>
                          </motion.div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="outlines">
              <div className="space-y-8">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                      Đại cương truyện
                    </h2>
                    <p className="text-muted-foreground">
                      Lên kế hoạch và tổ chức cốt truyện của bạn
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      startLoading(`/stories/${storyId}/outlines/create`);
                      router.push(`/stories/${storyId}/outlines/create`);
                    }}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-12 px-6 rounded-2xl font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm đại cương
                  </Button>
                </div>

                {outlines.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center py-12"
                  >
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-8 max-w-md mx-auto">
                      <BookOpen className="w-16 h-16 mx-auto mb-4 text-orange-400/50" />
                      <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                        Chưa có đại cương nào
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Tạo đại cương để lên kế hoạch và tổ chức cốt truyện
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="grid gap-6">
                    {outlines.map((outline, index) => (
                      <motion.div
                        key={outline.outline_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        whileHover={{ y: -4 }}
                      >
                        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 overflow-hidden group hover:shadow-2xl transition-all duration-300">
                          <CardHeader className="p-6 bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 dark:from-orange-900/10 dark:via-red-900/10 dark:to-pink-900/10">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent line-clamp-2">
                                  {outline.title}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="flex items-center gap-1 bg-orange-500/20 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full border border-orange-500/30">
                                    <Zap className="w-3 h-3" />
                                    <span className="text-xs font-medium">
                                      Đại cương
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 border border-orange-200 dark:border-orange-800">
                              <p className="text-muted-foreground leading-relaxed line-clamp-4">
                                {outline.description}
                              </p>
                            </div>
                          </CardContent>
                          <CardFooter className="p-6 pt-0">
                            <Button
                              variant="outline"
                              className="w-full bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 border border-white/20 dark:border-slate-600/20 h-10 rounded-2xl font-medium"
                              onClick={() => {
                                startLoading(
                                  `/stories/${storyId}/outlines/${outline.outline_id}/edit`
                                );
                                router.push(
                                  `/stories/${storyId}/outlines/${outline.outline_id}/edit`
                                );
                              }}
                            >
                              <Sparkles className="w-4 h-4 mr-2" />
                              Chỉnh sửa
                            </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
