/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { ChapterIdeaGenerator } from "@/components/ai-generator/ChapterIdeaGenerator";
import {
  ChevronLeft,
  Sparkles,
  BookOpen,
  MessageSquare,
  Edit3,
  Settings,
  Trash2,
} from "lucide-react";
import { useLoading } from "@/providers/loading-provider";
import { motion } from "framer-motion";

interface Chapter {
  chapter_id: number;
  title: string;
  summary?: string;
  status: "draft" | "published";
  dialogue_count: number;
}

export default function EditChapterContent({
  storyId,
  chapterId,
}: {
  storyId: string;
  chapterId: string;
}) {
  const router = useRouter();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { startLoading } = useLoading();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showIdeaGenerator, setShowIdeaGenerator] = useState(false);
  const [storyContext, setStoryContext] = useState<{
    title: string;
    description: string;
    mainCategory: string;
    tags: string[];
    characters?: {
      name: string;
      description: string;
      gender: string;
      personality: string;
      appearance: string;
      role: string;
    }[];
  } | null>(null);
  const [publishedChapters, setPublishedChapters] = useState<
    {
      title: string;
      summary?: string;
    }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const response = await fetch(
          `/api/stories/${storyId}/chapters/${chapterId}`
        );
        const data = await response.json();

        if (response.ok) {
          setChapter(data.chapter);
        } else {
          toast.error(data.error || "Không thể tải thông tin chương");
        }

        // Fetch story context
        const storyResponse = await fetch(`/api/stories/${storyId}`);
        if (storyResponse.ok) {
          const storyData = await storyResponse.json();
          setStoryContext({
            title: storyData.story.title,
            description: storyData.story.description,
            mainCategory: storyData.story.main_category,
            tags: storyData.story.tags,
            characters: storyData.story.characters,
          });
        }

        // Fetch published chapters
        const chaptersResponse = await fetch(
          `/api/stories/${storyId}/chapters?status=published`
        );
        if (chaptersResponse.ok) {
          const data = await chaptersResponse.json();
          setPublishedChapters(data.chapters);
        }
      } catch (error) {
        toast.error("Đã có lỗi xảy ra khi tải dữ liệu");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [storyId, chapterId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const title = formData.get("title");
      const summary = formData.get("summary");
      const status = formData.get("status");

      const response = await fetch(
        `/api/stories/${storyId}/chapters/${chapterId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title, summary, status }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Lỗi khi cập nhật chương");
      }

      toast.success("Cập nhật chương thành công!");
      startLoading(
        `/stories/${storyId}?tab=chapters&status=${data.chapter.status}`
      );
      router.push(
        `/stories/${storyId}?tab=chapters&status=${data.chapter.status}`
      );
    } catch (error: any) {
      toast.error(error.message || "Đã có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (chapter) {
      startLoading(`/stories/${storyId}?tab=chapters&status=${chapter.status}`);
      router.push(`/stories/${storyId}?tab=chapters&status=${chapter.status}`);
    } else {
      startLoading(`/stories/${storyId}?tab=chapters`);
      router.push(`/stories/${storyId}?tab=chapters`);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `/api/stories/${storyId}/chapters/${chapterId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Lỗi khi xóa chương");
      }

      toast.success("Xóa chương thành công!");
      startLoading(
        `/stories/${storyId}?tab=chapters&status=${chapter?.status}`
      );
      router.push(`/stories/${storyId}?tab=chapters&status=${chapter?.status}`);
    } catch (error: any) {
      toast.error(error.message || "Đã có lỗi xảy ra");
    }
  };

  const handleApplyIdea = (idea: { title: string; summary: string }) => {
    const titleInput = document.getElementById("title") as HTMLInputElement;
    const summaryInput = document.getElementById(
      "summary"
    ) as HTMLTextAreaElement;

    if (titleInput) titleInput.value = idea.title;
    if (summaryInput) summaryInput.value = idea.summary;
  };

  if (isLoadingData) {
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
                  <Skeleton width={140} height={24} className="rounded-full" />
                  <Skeleton height={48} className="rounded-2xl" />
                </div>

                <div className="space-y-3">
                  <Skeleton width={140} height={24} className="rounded-full" />
                  <Skeleton height={120} className="rounded-2xl" />
                </div>

                <div className="space-y-3">
                  <Skeleton width={100} height={24} className="rounded-full" />
                  <Skeleton height={48} className="rounded-2xl" />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6">
                  <Skeleton width={120} height={48} className="rounded-2xl" />
                  <div className="flex flex-col-reverse sm:flex-row gap-4 w-full sm:w-auto sm:ml-auto">
                    <Skeleton width={100} height={48} className="rounded-2xl" />
                    <Skeleton width={140} height={48} className="rounded-2xl" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (!chapter && !isLoadingData) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Đang tải...</p>
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
                <Edit3 className="w-8 h-8 text-blue-600" />
                Chỉnh sửa chương
              </h1>
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowIdeaGenerator(true)}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 dark:border-slate-700/50 hover:bg-white/90 dark:hover:bg-slate-800/90 shadow-lg"
            >
              <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
              Gợi ý cải thiện
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
                  Tiêu đề chương
                </Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={chapter?.title}
                  required
                  className="h-12 rounded-2xl border-blue-200 dark:border-blue-800 focus:border-blue-500 dark:focus:border-blue-400 bg-white/50 dark:bg-slate-700/50"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="summary"
                  className="text-lg font-semibold flex items-center"
                >
                  <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
                  Tóm tắt chương
                </Label>
                <textarea
                  id="summary"
                  name="summary"
                  defaultValue={chapter?.summary || ""}
                  placeholder="Mô tả ngắn gọn nội dung chương này..."
                  className="w-full min-h-[120px] px-4 py-3 rounded-2xl border border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-400 bg-white/50 dark:bg-slate-700/50 text-sm ring-offset-background resize-none"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="status"
                  className="text-lg font-semibold flex items-center"
                >
                  <Settings className="w-5 h-5 mr-2 text-indigo-600" />
                  Trạng thái
                </Label>
                <Select
                  name="status"
                  defaultValue={chapter?.status}
                  disabled={chapter?.dialogue_count === 0}
                >
                  <SelectTrigger className="h-12 rounded-2xl border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white/50 dark:bg-slate-700/50">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Bản nháp</SelectItem>
                    <SelectItem
                      value="published"
                      disabled={chapter?.dialogue_count === 0}
                    >
                      Xuất bản
                    </SelectItem>
                  </SelectContent>
                </Select>
                {chapter?.dialogue_count === 0 && (
                  <p className="text-sm text-destructive mt-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Cần có ít nhất một tin nhắn trong chương để xuất bản
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6">
                <Button
                  type="button"
                  variant="destructive"
                  size="lg"
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white shadow-lg"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa chương
                </Button>
                <div className="flex flex-col-reverse sm:flex-row gap-4 w-full sm:w-auto sm:ml-auto">
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
                        Đang lưu...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4" />
                        Lưu thay đổi
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Chương này sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {storyContext && chapter && (
        <ChapterIdeaGenerator
          storyContext={storyContext}
          existingChapter={chapter}
          publishedChapters={publishedChapters}
          onApplyIdea={handleApplyIdea}
          open={showIdeaGenerator}
          onOpenChange={setShowIdeaGenerator}
        />
      )}
    </div>
  );
}
