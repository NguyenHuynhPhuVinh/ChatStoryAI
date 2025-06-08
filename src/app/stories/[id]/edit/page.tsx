/* eslint-disable @next/next/no-async-client-component */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TextareaAutosize from "react-textarea-autosize";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Image from "next/image";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Suspense } from "react";
import {
  ChevronLeft,
  BookOpen,
  Sparkles,
  Zap,
  MessageCircle,
  Upload,
  Edit3,
  Trash2,
} from "lucide-react";
import { IdeaGenerator } from "@/components/ai-generator/StoryIdeaGenerator";
import { CoverImagePrompt } from "@/components/ai-generator/CoverImagePrompt";
import { useLoading } from "@/providers/loading-provider";
import { motion } from "framer-motion";

interface MainCategory {
  id: number;
  name: string;
  description?: string;
}

interface Tag {
  id: number;
  name: string;
  description?: string;
}

interface Story {
  story_id: number;
  title: string;
  description: string;
  cover_image: string | null;
  main_category_id: number;
  tag_ids: number[];
  status: "draft" | "published" | "archived";
}

interface GeneratedIdea {
  title: string;
  description: string;
  mainCategory: string;
  suggestedTags: string[];
}

function EditStoryContent({ storyId }: { storyId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { startLoading } = useLoading();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<
    number | null
  >(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [story, setStory] = useState<Story | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // Fetch categories và tags
        const categoriesResponse = await fetch("/api/categories");
        const categoriesData = await categoriesResponse.json();
        setMainCategories(categoriesData.mainCategories);
        setTags(categoriesData.tags);

        // Fetch story details
        const storyResponse = await fetch(`/api/stories/${storyId}`);
        const { story } = await storyResponse.json();

        if (storyResponse.ok && story) {
          setStory(story);
          setSelectedMainCategory(story.main_category_id);
          // Đảm bảo tag_ids là mảng số
          const tagIds = Array.isArray(story.tag_ids)
            ? story.tag_ids
            : story.tag_ids?.split(",").map(Number) || [];
          setSelectedTags(tagIds);
          setPreviewImage(story.cover_image || "");
        } else {
          toast.error("Không thể tải thông tin truyện");
        }
      } catch (error) {
        toast.error("Đã có lỗi xảy ra");
      } finally {
        setIsLoadingData(false);
      }
    };

    if (session?.user) {
      fetchData();
    }
  }, [session, storyId]);

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMainCategory) {
      toast.error("Vui lòng chọn thể loại chính");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);

      if (imageFile) {
        formData.delete("coverImage");
        formData.append("coverImage", imageFile);
      }

      formData.set("mainCategoryId", selectedMainCategory.toString());
      formData.set("tagIds", JSON.stringify(selectedTags));

      const response = await fetch(`/api/stories/${storyId}`, {
        method: "PUT",
        body: formData,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Lỗi khi cập nhật truyện");
      }

      await fetch(`/api/revalidate?path=/stories/${storyId}`);

      toast.success("Cập nhật truyện thành công!");

      router.refresh();

      startLoading("/stories");
      router.push("/stories");
    } catch (error: any) {
      toast.error(error.message || "Đã có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      // Thêm tham số để yêu cầu xóa tất cả dữ liệu liên quan
      const response = await fetch(`/api/stories/${storyId}?cascade=true`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Lỗi khi xóa truyện");
      }

      toast.success("Xóa truyện thành công");
      startLoading("/stories");
      router.push("/stories");
    } catch (error: any) {
      toast.error(error.message || "Đã có lỗi xảy ra");
    }
  };

  const checkPublishConditions = async (storyId: string) => {
    try {
      const response = await fetch(`/api/stories/${storyId}/chapters`);
      const data = await response.json();

      if (response.ok) {
        return data.chapters.some(
          (chapter: any) => chapter.status === "published"
        );
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      const canPublish = await checkPublishConditions(storyId);
      if (!canPublish) {
        toast.error("Cần có ít nhất một chương đã xuất bản để xuất bản truyện");
        setIsPublishing(false);
        return;
      }

      const response = await fetch(`/api/stories/${storyId}/publish`, {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error("Lỗi khi xuất bản truyện");
      }

      toast.success("Xuất bản truyện thành công!");
      // Cập nhật trạng thái truyện thành 'published'
      setStory((prev) => (prev ? { ...prev, status: "published" } : null));
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Đã có lỗi xảy ra");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleApplyIdea = (idea: GeneratedIdea) => {
    const titleInput = document.getElementById("title") as HTMLInputElement;
    const descriptionInput = document.getElementById(
      "description"
    ) as HTMLTextAreaElement;

    if (titleInput) titleInput.value = idea.title;
    if (descriptionInput) descriptionInput.value = idea.description;

    const matchedCategory = mainCategories.find(
      (cat) => cat.name.toLowerCase() === idea.mainCategory.toLowerCase()
    );
    if (matchedCategory) setSelectedMainCategory(matchedCategory.id);

    const matchedTags = tags.filter((tag) =>
      idea.suggestedTags.some(
        (suggestedTag) => tag.name.toLowerCase() === suggestedTag.toLowerCase()
      )
    );
    setSelectedTags(matchedTags.map((tag) => tag.id));
  };

  const mainCategoryName =
    mainCategories.find((c) => c.id === selectedMainCategory)?.name || "";
  const selectedTagNames = tags
    .filter((t) => selectedTags.includes(t.id))
    .map((t) => t.name);

  const handleImageGenerated = (imageData: string) => {
    const byteString = atob(imageData);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: "image/jpeg" });
    const file = new File([blob], "cover.jpg", { type: "image/jpeg" });

    setImageFile(file);
    setPreviewImage(`data:image/jpeg;base64,${imageData}`);
  };

  if (isLoadingData) {
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

        <div className="container mx-auto px-4 py-8 md:py-12 relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <Skeleton width={100} height={36} className="rounded-2xl" />
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8">
              <Skeleton width={200} height={36} className="rounded-2xl" />
              <div className="flex flex-col sm:flex-row gap-2">
                <Skeleton width={120} height={36} className="rounded-2xl" />
                <Skeleton width={120} height={36} className="rounded-2xl" />
                <Skeleton width={120} height={36} className="rounded-2xl" />
              </div>
            </div>

            <div className="grid md:grid-cols-[350px,1fr] gap-8">
              {/* Cột trái - Ảnh bìa */}
              <div className="space-y-4">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6">
                  <Skeleton
                    width={150}
                    height={24}
                    className="mb-4 rounded-full"
                  />
                  <Skeleton height={300} className="aspect-[3/4] rounded-2xl" />
                </div>
              </div>

              {/* Cột phải - Form thông tin */}
              <div className="space-y-6">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6 space-y-6">
                  <div className="space-y-3">
                    <Skeleton
                      width={120}
                      height={24}
                      className="rounded-full"
                    />
                    <Skeleton height={48} className="rounded-2xl" />
                  </div>
                  <div className="space-y-3">
                    <Skeleton
                      width={100}
                      height={24}
                      className="rounded-full"
                    />
                    <Skeleton height={120} className="rounded-2xl" />
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6 space-y-6">
                  <div className="space-y-3">
                    <Skeleton
                      width={140}
                      height={24}
                      className="rounded-full"
                    />
                    <div className="flex flex-wrap gap-3">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton
                          key={i}
                          width={80}
                          height={32}
                          className="rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Skeleton width={80} height={24} className="rounded-full" />
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton
                          key={i}
                          width={60}
                          height={24}
                          className="rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-8">
                  <Skeleton width={120} height={48} className="rounded-2xl" />
                  <Skeleton width={120} height={48} className="rounded-2xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Đang tải...</p>
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

      <div className="container mx-auto px-4 py-8 md:py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-8 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 border border-white/20 dark:border-slate-700/20"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại
          </Button>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 md:mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
              <Edit3 className="w-8 h-8 text-blue-600" />
              Chỉnh sửa truyện
            </h1>
            <div className="flex flex-col sm:flex-row gap-3">
              <IdeaGenerator
                mainCategories={mainCategories}
                tags={tags}
                onApplyIdea={handleApplyIdea}
                existingStory={{
                  title: story.title,
                  description: story.description,
                  mainCategory: mainCategoryName,
                  currentTags: selectedTagNames,
                }}
              />
              <CoverImagePrompt
                storyInfo={{
                  title:
                    (document.getElementById("title") as HTMLInputElement)
                      ?.value || "",
                  description:
                    (
                      document.getElementById(
                        "description"
                      ) as HTMLTextAreaElement
                    )?.value || "",
                  mainCategory:
                    mainCategories.find((c) => c.id === selectedMainCategory)
                      ?.name || "",
                  tags: tags
                    .filter((t) => selectedTags.includes(t.id))
                    .map((t) => t.name),
                }}
                onImageGenerated={handleImageGenerated}
              />
              {story.status === "draft" ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="default"
                      className="w-full sm:w-auto"
                      disabled={isPublishing}
                    >
                      {isPublishing ? "Đang xuất bản..." : "Xuất bản truyện"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Xác nhận xuất bản truyện
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Bạn có chắc chắn muốn xuất bản truyện này?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handlePublish}
                        disabled={isPublishing}
                      >
                        {isPublishing ? "Đang xuất bản..." : "Xuất bản"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button
                  variant="default"
                  className="w-full sm:w-auto"
                  disabled={true}
                >
                  Đã xuất bản
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto">
                    Xóa truyện
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận xóa truyện</AlertDialogTitle>
                    <AlertDialogDescription>
                      Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Xóa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            <div className="grid md:grid-cols-[350px,1fr] gap-8">
              {/* Cột trái - Ảnh bìa */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-4"
              >
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6">
                  <Label
                    htmlFor="coverImage"
                    className="text-lg font-semibold mb-4 block"
                  >
                    <Upload className="w-5 h-5 inline mr-2" />
                    Ảnh bìa truyện
                  </Label>
                  <Input
                    id="coverImage"
                    name="coverImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-2xl p-6 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20"
                    onClick={() =>
                      document.getElementById("coverImage")?.click()
                    }
                  >
                    {previewImage ? (
                      <div className="relative aspect-[3/4] w-full">
                        <Image
                          src={previewImage}
                          alt="Preview"
                          fill
                          className="rounded-2xl object-cover shadow-lg"
                        />
                      </div>
                    ) : (
                      <div className="py-12">
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
                          <Upload className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                        </motion.div>
                        <p className="text-slate-600 dark:text-slate-400 font-medium">
                          Nhấn để chọn ảnh bìa
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Định dạng: JPG, PNG (Tỷ lệ 3:4)
                        </p>
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>

              {/* Cột phải - Form thông tin */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="space-y-6"
              >
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6 space-y-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="title"
                      className="text-lg font-semibold flex items-center"
                    >
                      <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                      Tiêu đề truyện
                    </Label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={story.title}
                      placeholder="Nhập tiêu đề hấp dẫn cho truyện của bạn..."
                      required
                      className="h-12 rounded-2xl border-blue-200 dark:border-blue-800 focus:border-blue-500 dark:focus:border-blue-400 bg-white/50 dark:bg-slate-700/50"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="description"
                      className="text-lg font-semibold flex items-center"
                    >
                      <MessageCircle className="w-5 h-5 mr-2 text-purple-600" />
                      Mô tả truyện
                    </Label>
                    <div className="relative">
                      <TextareaAutosize
                        id="description"
                        name="description"
                        defaultValue={story.description}
                        placeholder="Mô tả ngắn gọn về nội dung, nhân vật và cốt truyện..."
                        required
                        minRows={4}
                        className="w-full resize-none rounded-2xl border border-purple-200 dark:border-purple-800 bg-white/50 dark:bg-slate-700/50 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6 space-y-6">
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold flex items-center">
                      <Sparkles className="w-5 h-5 mr-2 text-yellow-600" />
                      Thể loại chính
                    </Label>
                    <div className="flex flex-wrap gap-3">
                      {mainCategories.map((category) => (
                        <motion.div
                          key={category.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Badge
                            variant={
                              selectedMainCategory === category.id
                                ? "default"
                                : "outline"
                            }
                            className={`cursor-pointer text-sm px-4 py-2 rounded-full transition-all duration-300 ${
                              selectedMainCategory === category.id
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl"
                                : "bg-white/50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:border-blue-500 dark:hover:border-blue-400"
                            }`}
                            onClick={() => setSelectedMainCategory(category.id)}
                          >
                            {category.name}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                    {!selectedMainCategory && (
                      <p className="text-sm text-red-500 dark:text-red-400 flex items-center">
                        <Zap className="w-4 h-4 mr-1" />
                        Vui lòng chọn một thể loại chính
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-lg font-semibold flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-green-600" />
                      Thẻ phụ
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <motion.div
                          key={tag.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Badge
                            variant={
                              selectedTags.includes(tag.id)
                                ? "default"
                                : "outline"
                            }
                            className={`cursor-pointer text-xs px-3 py-1 rounded-full transition-all duration-300 ${
                              selectedTags.includes(tag.id)
                                ? "bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-md"
                                : "bg-white/50 dark:bg-slate-700/50 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800 hover:border-green-500 dark:hover:border-green-400"
                            }`}
                            onClick={() => toggleTag(tag.id)}
                          >
                            {tag.name}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                        Đã chọn {selectedTags.length} thẻ
                      </span>
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex justify-end gap-4 pt-8"
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="w-full md:w-auto md:min-w-[150px] h-12 rounded-2xl bg-white/50 dark:bg-slate-700/50 hover:bg-white dark:hover:bg-slate-700 border border-white/20 dark:border-slate-600/20 font-medium"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="w-full md:w-auto md:min-w-[150px] h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                disabled={isLoading || !selectedMainCategory}
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
                    Đang cập nhật...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    Cập nhật truyện
                  </div>
                )}
              </Button>
            </motion.div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}

export default async function EditStoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditStoryContent storyId={resolvedParams.id} />
    </Suspense>
  );
}
