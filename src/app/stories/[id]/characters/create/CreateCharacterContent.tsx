/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Camera,
  ChevronLeft,
  User,
  Users,
  Sparkles,
  Image as ImageIcon,
  Calendar,
  Ruler,
  Weight,
  Heart,
  Eye,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { IdeaGenerator } from "@/components/ai-generator/CharacterIdeaGenerator";
import { AvatarImagePrompt } from "@/components/ai-generator/AvatarImagePrompt";
import { useLoading } from "@/providers/loading-provider";
import { motion } from "framer-motion";

export default function CreateCharacterContent({
  storyId,
}: {
  storyId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startLoading } = useLoading();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [previewImage, setPreviewImage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [storyContext, setStoryContext] = useState<{
    title: string;
    description: string;
    mainCategory: string;
    tags: string[];
  } | null>(null);
  const [formValues, setFormValues] = useState({
    name: "",
    description: "",
    gender: "",
    birthday: "",
    height: "",
    weight: "",
    personality: "",
    appearance: "",
    background: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchStoryContext = async () => {
      setIsLoadingData(true);
      try {
        const response = await fetch(`/api/stories/${storyId}`);
        if (!response.ok) {
          throw new Error("Không thể lấy thông tin truyện");
        }
        const data = await response.json();
        setStoryContext({
          title: data.story.title,
          description: data.story.description,
          mainCategory: data.story.main_category,
          tags: data.story.tags,
        });
      } catch (error) {
        toast.error("Lỗi khi lấy thông tin truyện");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchStoryContext();
  }, [storyId]);

  // Lấy role từ searchParams bằng hook
  const roleParam = searchParams.get("role");
  const role = roleParam?.toLowerCase() === "main" ? "main" : "supporting";

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!imageFile) {
      toast.error("Vui lòng chọn ảnh avatar");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);

      formData.delete("avatarImage");
      formData.append("avatarImage", imageFile);

      const response = await fetch(`/api/stories/${storyId}/characters`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Lỗi khi tạo nhân vật");
      }

      toast.success("Tạo nhân vật thành công!");
      startLoading(`/stories/${storyId}?tab=characters`);
      router.push(`/stories/${storyId}?tab=characters`);
    } catch (error: any) {
      toast.error(error.message || "Đã có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyIdea = (idea: any) => {
    const nameInput = document.getElementById("name") as HTMLInputElement;
    const descriptionInput = document.getElementById(
      "description"
    ) as HTMLTextAreaElement;
    const genderInput = document.getElementById("gender") as HTMLSelectElement;
    const birthdayInput = document.getElementById(
      "birthday"
    ) as HTMLInputElement;
    const heightInput = document.getElementById("height") as HTMLInputElement;
    const weightInput = document.getElementById("weight") as HTMLInputElement;
    const personalityInput = document.getElementById(
      "personality"
    ) as HTMLTextAreaElement;
    const appearanceInput = document.getElementById(
      "appearance"
    ) as HTMLTextAreaElement;
    const backgroundInput = document.getElementById(
      "background"
    ) as HTMLTextAreaElement;

    if (nameInput) nameInput.value = idea.name;
    if (descriptionInput) descriptionInput.value = idea.description;
    if (genderInput) genderInput.value = idea.gender;
    if (birthdayInput) birthdayInput.value = idea.birthday;
    if (heightInput) heightInput.value = idea.height;
    if (weightInput) weightInput.value = idea.weight;
    if (personalityInput) personalityInput.value = idea.personality;
    if (appearanceInput) appearanceInput.value = idea.appearance;
    if (backgroundInput) backgroundInput.value = idea.background;

    setFormValues({
      name: idea.name || "",
      description: idea.description || "",
      gender: idea.gender || "",
      birthday: idea.birthday || "",
      height: idea.height || "",
      weight: idea.weight || "",
      personality: idea.personality || "",
      appearance: idea.appearance || "",
      background: idea.background || "",
    });
  };

  const handleImageGenerated = (imageData: string) => {
    const byteString = atob(imageData);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: "image/jpeg" });
    const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });

    setImageFile(file);
    setPreviewImage(`data:image/jpeg;base64,${imageData}`);
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

        <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12 relative z-10">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <Skeleton width={300} height={40} className="rounded-2xl" />
              <div className="flex flex-col sm:flex-row gap-3">
                <Skeleton width={140} height={44} className="rounded-2xl" />
                <Skeleton width={140} height={44} className="rounded-2xl" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6 md:p-8"
            >
              <div className="flex flex-col items-center mb-8">
                <Skeleton circle width={160} height={160} className="mb-4" />
                <Skeleton width={120} height={20} className="rounded-full" />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton
                      width={120}
                      height={24}
                      className="rounded-full"
                    />
                    <Skeleton
                      height={i % 3 === 1 ? 120 : 48}
                      className="rounded-2xl"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-4 pt-8">
                <Skeleton width={140} height={48} className="rounded-2xl" />
                <Skeleton width={100} height={48} className="rounded-2xl" />
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

      <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12 relative z-10">
        {storyContext ? (
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
                  onClick={() => {
                    startLoading(`/stories/${storyId}?tab=characters`);
                    router.push(`/stories/${storyId}?tab=characters`);
                  }}
                  className="hover:bg-white/20 dark:hover:bg-slate-800/20"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Quay lại
                </Button>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-600" />
                  {role === "main"
                    ? "Thêm nhân vật chính"
                    : "Thêm nhân vật phụ"}
                </h1>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <IdeaGenerator
                  role={role}
                  storyContext={storyContext}
                  onApplyIdea={handleApplyIdea}
                />
                <AvatarImagePrompt
                  characterInfo={{
                    name: formValues.name,
                    description: formValues.description,
                    gender: formValues.gender,
                    personality: formValues.personality,
                    appearance: formValues.appearance,
                    role: role,
                  }}
                  onImageGenerated={handleImageGenerated}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6 md:p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="flex flex-col items-center">
                  <div
                    onClick={handleImageClick}
                    className="relative cursor-pointer group mb-6"
                  >
                    <div
                      className={`w-40 h-40 rounded-full overflow-hidden border-4 border-dashed
                      ${
                        previewImage
                          ? "border-transparent"
                          : "border-blue-300 dark:border-blue-600"
                      }
                      flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30
                      transition-all duration-300 shadow-lg hover:shadow-xl`}
                    >
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-12 h-12 text-blue-500" />
                      )}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-sm font-medium">
                        {previewImage ? "Thay đổi ảnh" : "Tải ảnh lên"}
                      </span>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    name="avatarImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="name"
                      className="text-lg font-semibold flex items-center"
                    >
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      Tên nhân vật
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      placeholder="Nhập tên nhân vật..."
                      className="h-12 rounded-2xl border-blue-200 dark:border-blue-800 focus:border-blue-500 dark:focus:border-blue-400 bg-white/50 dark:bg-slate-700/50"
                      value={formValues.name}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="gender"
                      className="text-lg font-semibold flex items-center"
                    >
                      <Users className="w-5 h-5 mr-2 text-purple-600" />
                      Giới tính
                    </Label>
                    <select
                      id="gender"
                      name="gender"
                      className="h-12 w-full rounded-2xl border border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-400 bg-white/50 dark:bg-slate-700/50 px-4"
                      value={formValues.gender}
                      onChange={handleInputChange}
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="nam">Nam</option>
                      <option value="nữ">Nữ</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="birthday"
                      className="text-lg font-semibold flex items-center"
                    >
                      <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                      Ngày sinh
                    </Label>
                    <input
                      id="birthday"
                      type="date"
                      name="birthday"
                      className="h-12 w-full rounded-2xl border border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white/50 dark:bg-slate-700/50 px-4"
                      value={formValues.birthday}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="height"
                      className="text-lg font-semibold flex items-center"
                    >
                      <Ruler className="w-5 h-5 mr-2 text-green-600" />
                      Chiều cao
                    </Label>
                    <input
                      id="height"
                      type="text"
                      name="height"
                      placeholder="Nhập chiều cao (cm)"
                      className="h-12 w-full rounded-2xl border border-green-200 dark:border-green-800 focus:border-green-500 dark:focus:border-green-400 bg-white/50 dark:bg-slate-700/50 px-4"
                      value={formValues.height}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="weight"
                      className="text-lg font-semibold flex items-center"
                    >
                      <Weight className="w-5 h-5 mr-2 text-orange-600" />
                      Cân nặng
                    </Label>
                    <input
                      id="weight"
                      type="text"
                      name="weight"
                      placeholder="Nhập cân nặng (kg)"
                      className="h-12 w-full rounded-2xl border border-orange-200 dark:border-orange-800 focus:border-orange-500 dark:focus:border-orange-400 bg-white/50 dark:bg-slate-700/50 px-4"
                      value={formValues.weight}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <Label
                      htmlFor="description"
                      className="text-lg font-semibold flex items-center"
                    >
                      <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                      Mô tả tổng quan
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Mô tả tổng quan về nhân vật..."
                      className="min-h-[120px] rounded-2xl border-blue-200 dark:border-blue-800 focus:border-blue-500 dark:focus:border-blue-400 bg-white/50 dark:bg-slate-700/50 resize-none"
                      value={formValues.description}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <Label
                      htmlFor="personality"
                      className="text-lg font-semibold flex items-center"
                    >
                      <Heart className="w-5 h-5 mr-2 text-pink-600" />
                      Tính cách
                    </Label>
                    <Textarea
                      id="personality"
                      name="personality"
                      placeholder="Mô tả tính cách và đặc điểm tâm lý..."
                      className="min-h-[120px] rounded-2xl border-pink-200 dark:border-pink-800 focus:border-pink-500 dark:focus:border-pink-400 bg-white/50 dark:bg-slate-700/50 resize-none"
                      value={formValues.personality}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <Label
                      htmlFor="appearance"
                      className="text-lg font-semibold flex items-center"
                    >
                      <Eye className="w-5 h-5 mr-2 text-cyan-600" />
                      Ngoại hình
                    </Label>
                    <Textarea
                      id="appearance"
                      name="appearance"
                      placeholder="Mô tả chi tiết ngoại hình..."
                      className="min-h-[120px] rounded-2xl border-cyan-200 dark:border-cyan-800 focus:border-cyan-500 dark:focus:border-cyan-400 bg-white/50 dark:bg-slate-700/50 resize-none"
                      value={formValues.appearance}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <Label
                      htmlFor="background"
                      className="text-lg font-semibold flex items-center"
                    >
                      <BookOpen className="w-5 h-5 mr-2 text-amber-600" />
                      Quá khứ & Xuất thân
                    </Label>
                    <Textarea
                      id="background"
                      name="background"
                      placeholder="Thông tin về xuất thân, quá khứ và lịch sử..."
                      className="min-h-[120px] rounded-2xl border-amber-200 dark:border-amber-800 focus:border-amber-500 dark:focus:border-amber-400 bg-white/50 dark:bg-slate-700/50 resize-none"
                      value={formValues.background}
                      onChange={handleInputChange}
                    />
                  </div>

                  <input type="hidden" name="role" value={role} />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-4 pt-8 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      startLoading(`/stories/${storyId}?tab=characters`);
                      router.push(`/stories/${storyId}?tab=characters`);
                    }}
                    className="w-full sm:w-auto bg-white/50 dark:bg-slate-700/50 border-gray-200 dark:border-gray-700 hover:bg-white/70 dark:hover:bg-slate-700/70"
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
                        <Users className="w-4 h-4" />
                        Tạo nhân vật
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        ) : (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-lg text-gray-600 dark:text-gray-400">
                Đang tải thông tin truyện...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
