/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ChevronLeft, Sparkles, FileText, Edit3, BookOpen } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { OutlineIdeaGenerator } from "@/components/ai-generator/OutlineIdeaGenerator";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useLoading } from "@/providers/loading-provider";
import { motion } from "framer-motion";

interface Story {
  title: string;
  description: string;
  main_category: string;
  tags: string[];
  characters?: {
    name: string;
    description: string;
    gender: string;
    personality: string;
    appearance: string;
    role: string;
  }[];
}

export default function CreateOutlineContent({ storyId }: { storyId: string }) {
  const router = useRouter();
  const { startLoading } = useLoading();
  const [isLoading, setIsLoading] = useState(false);
  const [showIdeaGenerator, setShowIdeaGenerator] = useState(false);
  const [storyData, setStoryData] = useState<Story | null>(null);
  const [publishedChapters, setPublishedChapters] = useState<
    {
      title: string;
      summary?: string;
    }[]
  >([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  useEffect(() => {
    const fetchStoryData = async () => {
      try {
        // Fetch story data
        const storyResponse = await fetch(`/api/stories/${storyId}`);
        const storyJson = await storyResponse.json();
        if (storyResponse.ok) {
          setStoryData(storyJson.story);
        }

        // Fetch published chapters
        const chaptersResponse = await fetch(
          `/api/stories/${storyId}/chapters/published`
        );
        const chaptersJson = await chaptersResponse.json();
        if (chaptersResponse.ok) {
          setPublishedChapters(chaptersJson.chapters);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Không thể tải thông tin truyện");
      }
    };

    fetchStoryData();
  }, [storyId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/stories/${storyId}/outlines`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Lỗi khi tạo đại cương mới");
      }

      toast.success("Tạo đại cương mới thành công!");
      startLoading(`/stories/${storyId}?tab=outlines`);
      router.push(`/stories/${storyId}?tab=outlines`);
    } catch (error: any) {
      toast.error(error.message || "Đã có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    startLoading(`/stories/${storyId}?tab=outlines`);
    router.push(`/stories/${storyId}?tab=outlines`);
  };

  const handleApplyIdea = (idea: { title: string; description: string }) => {
    setFormData({
      title: idea.title,
      description: idea.description,
    });
  };

  if (!storyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 relative overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20" />

        {/* Floating Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"
            style={{ top: "10%", left: "10%" }}
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"
            style={{ top: "50%", right: "10%" }}
            animate={{
              x: [0, -30, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="container max-w-3xl mx-auto px-4 py-8 md:py-12 relative z-10">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-between flex-wrap gap-4"
            >
              <Skeleton width={280} height={40} className="rounded-2xl" />
              <Skeleton width={160} height={44} className="rounded-2xl" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6 md:p-8"
            >
              <div className="space-y-6">
                <div className="space-y-3">
                  <Skeleton width={160} height={24} className="rounded-full" />
                  <Skeleton height={48} className="rounded-2xl" />
                </div>

                <div className="space-y-3">
                  <Skeleton width={100} height={24} className="rounded-full" />
                  <Skeleton height={120} className="rounded-2xl" />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6">
                  <Skeleton width={100} height={48} className="rounded-2xl" />
                  <Skeleton width={140} height={48} className="rounded-2xl" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20" />

      {/* Floating Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"
          style={{ top: "10%", left: "10%" }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"
          style={{ top: "50%", right: "10%" }}
          animate={{
            x: [0, -30, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl"
          style={{ bottom: "10%", left: "20%" }}
          animate={{
            x: [0, 40, 0],
            y: [0, -20, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="container max-w-3xl mx-auto px-4 py-8 md:py-12 relative z-10">
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="hover:bg-white/20 dark:hover:bg-slate-800/20"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Quay lại
              </Button>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Tạo đại cương mới
              </h1>
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowIdeaGenerator(true)}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 dark:border-slate-700/50 hover:bg-white/90 dark:hover:bg-slate-800/90 shadow-lg"
            >
              <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
              Đề xuất ý tưởng
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6 md:p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label
                  htmlFor="title"
                  className="text-lg font-semibold flex items-center"
                >
                  <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                  Tiêu đề đại cương
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Nhập tiêu đề hấp dẫn cho đại cương..."
                  required
                  className="h-12 rounded-2xl border-blue-200 dark:border-blue-800 focus:border-blue-500 dark:focus:border-blue-400 bg-white/50 dark:bg-slate-700/50"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="description"
                  className="text-lg font-semibold flex items-center"
                >
                  <Edit3 className="w-5 h-5 mr-2 text-purple-600" />
                  Mô tả chi tiết
                </Label>
                <TextareaAutosize
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Mô tả chi tiết nội dung và ý tưởng của đại cương..."
                  minRows={4}
                  className="w-full px-4 py-3 rounded-2xl border border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-400 bg-white/50 dark:bg-slate-700/50 text-sm ring-offset-background resize-none"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white/50 dark:bg-slate-700/50 border-gray-200 dark:border-gray-700 hover:bg-white/70 dark:hover:bg-slate-700/70"
                  onClick={handleCancel}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Đang tạo...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Tạo đại cương
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      <OutlineIdeaGenerator
        storyContext={{
          title: storyData.title,
          description: storyData.description,
          mainCategory: storyData.main_category,
          tags: storyData.tags,
          characters: storyData.characters,
        }}
        publishedChapters={publishedChapters}
        onApplyIdea={handleApplyIdea}
        open={showIdeaGenerator}
        onOpenChange={setShowIdeaGenerator}
      />
    </div>
  );
}
