/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Plus, Send, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Story {
  story_id: number;
  title: string;
  main_category: string;
  status: "draft" | "published" | "archived";
  chapters?: any[];
  dialogues?: any[];
  characters?: any[];
  outlines?: any[];
}

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  selectedImages: string[];
  onImageUpload: (file: File) => void;
  onClearImage: (index: number) => void;
  onClearAllImages: () => void;
  onStorySelect: (story: Story | null) => void;
}

export function ChatInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
  selectedImages,
  onImageUpload,
  onClearImage,
  onClearAllImages,
  onStorySelect,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoadingStories, setIsLoadingStories] = useState(true);
  const [selectedValue, setSelectedValue] = useState<string>("0");

  const fetchStories = async () => {
    try {
      const response = await fetch("/api/stories");
      const data = await response.json();
      if (response.ok) {
        setStories(data.stories);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách truyện:", error);
      toast.error("Không thể tải danh sách truyện");
    } finally {
      setIsLoadingStories(false);
    }
  };

  // Lắng nghe sự kiện tạo truyện thành công
  useEffect(() => {
    const handleStoryCreated = async (event: CustomEvent) => {
      await fetchStories(); // Fetch lại danh sách truyện
      // Tự động chọn truyện mới tạo
      const newStory = event.detail;
      if (newStory?.story_id) {
        onStorySelect(newStory);
      }
    };

    window.addEventListener("story-created" as any, handleStoryCreated);
    return () => {
      window.removeEventListener("story-created" as any, handleStoryCreated);
    };
  }, [onStorySelect]);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStoryDetails = async (story: Story) => {
    try {
      // Fetch all related data
      const [chaptersRes, charactersListRes, outlinesRes] = await Promise.all([
        fetch(`/api/stories/${story.story_id}/chapters`),
        fetch(`/api/stories/${story.story_id}/characters`),
        fetch(`/api/stories/${story.story_id}/outlines`),
      ]);

      if (chaptersRes.ok) {
        const chaptersData = await chaptersRes.json();
        const allChapters = chaptersData.chapters;

        const dialoguesPromises = allChapters.map(async (chapter: any) => {
          const dialoguesRes = await fetch(
            `/api/stories/${story.story_id}/chapters/${chapter.chapter_id}/dialogues`
          );
          if (dialoguesRes.ok) {
            const dialoguesData = await dialoguesRes.json();
            return {
              chapter_id: chapter.chapter_id,
              dialogues: dialoguesData.dialogues,
            };
          }
          return null;
        });

        const chapterDialogues = await Promise.all(dialoguesPromises);
        story.chapters = allChapters;
        story.dialogues = chapterDialogues.filter((d) => d !== null);
      }

      if (charactersListRes.ok) {
        const charactersListData = await charactersListRes.json();
        const charactersDetailPromises = charactersListData.characters.map(
          async (char: any) => {
            const detailRes = await fetch(
              `/api/stories/${story.story_id}/characters/${char.character_id}/get`
            );
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              return detailData.character;
            }
            return null;
          }
        );

        const characters = await Promise.all(charactersDetailPromises);
        story.characters = characters.filter((c) => c !== null);
      }

      if (outlinesRes.ok) {
        const outlinesData = await outlinesRes.json();
        story.outlines = outlinesData.outlines;
      }

      return story;
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu truyện:", error);
      return null;
    }
  };

  // Trong useEffect cho command-executed
  useEffect(() => {
    const handleCommandExecuted = async (event: any) => {
      console.log("[ChatInput] Command executed event received:", event.detail);
      await fetchStories();

      // Sử dụng selectedValue đã lưu
      if (selectedValue && selectedValue !== "0") {
        console.log("[ChatInput] Current selected story value:", selectedValue);
        const story = stories.find(
          (s) => s.story_id.toString() === selectedValue
        );
        if (story) {
          const updatedStory = await fetchStoryDetails(story);
          if (updatedStory) {
            console.log("[ChatInput] Story details fetched successfully");
            onStorySelect(updatedStory);
          }
        }
      } else {
        console.log("[ChatInput] No story selected");
      }
    };

    window.addEventListener("command-executed", handleCommandExecuted);
    return () => {
      window.removeEventListener("command-executed", handleCommandExecuted);
    };
  }, [stories, onStorySelect, selectedValue]); // Thêm selectedValue vào dependencies

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        onImageUpload(file);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(e);
    // Reset textarea height sau khi gửi
    if (textareaRef.current) {
      textareaRef.current.style.height = "56px";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept="image/*"
        multiple
      />
      <div className="mx-auto max-w-4xl px-4 py-4">
        {selectedImages.length > 0 && (
          <div className="relative mb-4">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {selectedImages.map((image, index) => (
                <div key={index} className="relative w-24 h-24 flex-shrink-0">
                  <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-blue-100 dark:border-blue-800 shadow-sm">
                    <Image
                      src={image}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg"
                    onClick={() => onClearImage(index)}
                    disabled={isLoading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            {selectedImages.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAllImages}
                className="absolute top-0 right-0 text-xs"
                disabled={isLoading}
              >
                <X className="h-3 w-3 mr-1" />
                Xóa tất cả
              </Button>
            )}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                📚
              </div>
              <span className="hidden sm:inline">Truyện:</span>
            </div>
            <Select
              value={selectedValue}
              onValueChange={async (value) => {
                setSelectedValue(value);
                const story = stories.find(
                  (s) => s.story_id.toString() === value
                );
                if (story) {
                  const updatedStory = await fetchStoryDetails(story);
                  onStorySelect(updatedStory || null);
                } else {
                  onStorySelect(null);
                }
              }}
            >
              <SelectTrigger className="flex-1 h-10 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <SelectValue
                  placeholder={
                    isLoadingStories
                      ? "⏳ Đang tải..."
                      : "Chọn truyện để làm việc (tùy chọn)"
                  }
                />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="0" className="rounded-lg">
                  <div className="flex items-center gap-2">
                    <span>🚫</span>
                    <span>Không chọn truyện</span>
                  </div>
                </SelectItem>
                {stories.map((story) => (
                  <SelectItem
                    key={story.story_id}
                    value={story.story_id.toString()}
                    className="rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span>📖</span>
                      <span className="truncate">{story.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 items-end">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-12 w-12 shrink-0 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200"
              disabled={isLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </Button>

            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                placeholder="💭 Hãy hỏi AI về ý tưởng, nhân vật, cốt truyện... hoặc bất cứ điều gì bạn muốn!"
                className="min-h-[48px] max-h-[120px] resize-none rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 px-4 py-3"
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                disabled={isLoading}
                rows={1}
                onKeyDown={handleKeyDown}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "48px";
                  target.style.height = `${Math.min(
                    target.scrollHeight,
                    120
                  )}px`;
                }}
              />
              {isLoading && (
                <div className="absolute right-3 top-3">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                </div>
              )}
            </div>

            <Button
              type="submit"
              size="icon"
              className="h-12 w-12 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              disabled={isLoading || (!input.trim() && !selectedImages.length)}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </form>

        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              ⌘
            </div>
            <span>Ctrl + Enter để gửi</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              📎
            </div>
            <span>Hỗ trợ tải ảnh</span>
          </div>
        </div>
      </div>
    </div>
  );
}
