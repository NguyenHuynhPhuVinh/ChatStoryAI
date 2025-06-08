/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { StoryCard } from "@/components/story-card";
import { BookOpenText, TrendingUp, Flame, Star, Crown } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { motion } from "framer-motion";

interface Story {
  story_id: number;
  title: string;
  description: string;
  cover_image: string | null;
  main_category: string;
  view_count: number;
  favorite_count: number; // thêm trường này
  updated_at: string;
}

export default function PopularStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchStories = async (pageNumber: number) => {
    try {
      const response = await fetch(`/api/library/popular?page=${pageNumber}`);
      const data = await response.json();

      if (response.ok) {
        if (pageNumber === 1) {
          setStories(data.stories);
        } else {
          setStories((prev) => [...prev, ...data.stories]);
        }
        setHasMore(data.stories.length > 0);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách truyện:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStories(1);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 100 &&
        !isLoading &&
        hasMore
      ) {
        setIsLoading(true);
        setPage((prev) => {
          const nextPage = prev + 1;
          fetchStories(nextPage);
          return nextPage;
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLoading, hasMore]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-50 dark:from-slate-900 dark:via-orange-900/20 dark:to-red-900/20">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 120, 0],
            y: [0, -80, 0],
            rotate: [0, 270, 360],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/3 left-1/5 w-72 h-72 bg-orange-400/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -100, 0],
            y: [0, 120, 0],
            rotate: [360, 90, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-2/3 right-1/5 w-80 h-80 bg-red-400/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                  Truyện Hot
                </span>
              </h1>
              <p className="text-lg text-muted-foreground mt-2 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Những câu chuyện được yêu thích nhất
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stories Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          {stories.map((story, index) => (
            <motion.div
              key={story.story_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              {/* Top 3 Crown Badge */}
              {index < 3 && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                  className="absolute -top-3 -right-3 z-20"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                      index === 0
                        ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                        : index === 1
                        ? "bg-gradient-to-r from-gray-300 to-gray-500"
                        : "bg-gradient-to-r from-orange-400 to-orange-600"
                    }`}
                  >
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs font-bold text-white bg-black/50 rounded px-1">
                    #{index + 1}
                  </div>
                </motion.div>
              )}
              <StoryCard story={story} />
            </motion.div>
          ))}

          {isLoading && (
            <>
              {Array(4)
                .fill(0)
                .map((_, index) => (
                  <motion.div
                    key={`skeleton-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 overflow-hidden"
                  >
                    <div className="relative aspect-[3/4] w-full">
                      <Skeleton
                        height="100%"
                        baseColor="#fef7ed"
                        highlightColor="#fed7aa"
                      />
                    </div>
                    <div className="p-5 space-y-3">
                      <Skeleton
                        width="80%"
                        height={24}
                        baseColor="#fef7ed"
                        highlightColor="#fed7aa"
                      />
                      <Skeleton
                        width="60%"
                        height={16}
                        baseColor="#fef7ed"
                        highlightColor="#fed7aa"
                      />
                      <Skeleton
                        width="40%"
                        height={16}
                        baseColor="#fef7ed"
                        highlightColor="#fed7aa"
                      />
                    </div>
                  </motion.div>
                ))}
            </>
          )}
        </motion.div>

        {/* Loading More Indicator */}
        {isLoading && stories.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center mt-12"
          >
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 px-6 py-3">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium text-muted-foreground">
                  Đang tải thêm truyện hot...
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && stories.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-16"
          >
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Flame className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Chưa có truyện hot
              </h3>
              <p className="text-muted-foreground">
                Hãy quay lại sau để khám phá những câu chuyện đang trending
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
