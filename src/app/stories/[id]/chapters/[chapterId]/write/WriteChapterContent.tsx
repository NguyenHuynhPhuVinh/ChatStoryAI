/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  Pencil,
  Trash2,
  ChevronLeft,
  Users,
  ChevronUp,
  ChevronDown,
  Sparkles,
  MessageSquare,
  Edit3,
  Send,
  Bot,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { DialogueGenerator } from "@/components/ai-generator/DialogueGenerator";
import { useLoading } from "@/providers/loading-provider";
import { motion } from "framer-motion";

interface Character {
  character_id: number;
  name: string;
  description: string;
  gender: string;
  personality: string;
  appearance: string;
  avatar_image: string;
  role: "main" | "supporting";
}

interface Dialogue {
  dialogue_id: number;
  character_id: number | null;
  content: string;
  order_number: number;
  type?: "dialogue" | "aside";
}

interface Chapter {
  chapter_id: number;
  title: string;
  status: "draft" | "published";
  summary?: string;
}

interface Story {
  title: string;
  description: string;
  mainCategory: string;
  tags: string[];
}

export default function WriteChapterContent({
  storyId,
  chapterId,
}: {
  storyId: string;
  chapterId: string;
}) {
  const router = useRouter();
  const { startLoading } = useLoading();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<number | null>(
    null
  );
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"main" | "supporting">("main");
  const [editingDialogue, setEditingDialogue] = useState<Dialogue | null>(null);
  const [deleteDialogueId, setDeleteDialogueId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [messageType, setMessageType] = useState<"dialogue" | "aside">(
    "dialogue"
  );
  const [story, setStory] = useState<Story | null>(null);
  const [generatedDialogues, setGeneratedDialogues] = useState<
    Array<{
      content: string;
      type: string;
      characters: string[];
      added: boolean;
      id?: number;
    }>
  >([]);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [publishedChapters, setPublishedChapters] = useState<
    {
      title: string;
      summary?: string;
    }[]
  >([]);
  const [outlines, setOutlines] = useState<
    {
      title: string;
      description: string;
    }[]
  >([]);

  const mainCharacters = characters.filter((c) => c.role === "main");
  const supportingCharacters = characters.filter(
    (c) => c.role === "supporting"
  );

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const storyRes = await fetch(`/api/stories/${storyId}`);
        const storyData = await storyRes.json();
        if (storyRes.ok) {
          setStory(storyData.story);
        }

        const chapterRes = await fetch(
          `/api/stories/${storyId}/chapters/${chapterId}`
        );
        const chapterData = await chapterRes.json();
        if (chapterRes.ok) {
          setChapter(chapterData.chapter);
        }

        const charactersRes = await fetch(`/api/stories/${storyId}/characters`);
        const charactersData = await charactersRes.json();
        if (charactersRes.ok) {
          setCharacters(charactersData.characters);
        }

        const dialoguesRes = await fetch(
          `/api/stories/${storyId}/chapters/${chapterId}/dialogues`
        );
        const dialoguesData = await dialoguesRes.json();
        if (dialoguesRes.ok) {
          setDialogues(dialoguesData.dialogues);
        }

        // Fetch published chapters
        const publishedChaptersRes = await fetch(
          `/api/stories/${storyId}/chapters?status=published`
        );
        const publishedChaptersData = await publishedChaptersRes.json();
        if (publishedChaptersRes.ok) {
          setPublishedChapters(publishedChaptersData.chapters);
        }

        // Fetch outlines
        const outlinesRes = await fetch(`/api/stories/${storyId}/outlines`);
        const outlinesData = await outlinesRes.json();
        if (outlinesRes.ok) {
          setOutlines(outlinesData.outlines);
        }
      } catch (error) {
        toast.error("Không thể tải dữ liệu");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [storyId, chapterId]);

  const handleSendMessage = async () => {
    if (
      (!selectedCharacter && messageType === "dialogue") ||
      !newMessage.trim()
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/stories/${storyId}/chapters/${chapterId}/dialogues`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            character_id: messageType === "aside" ? null : selectedCharacter,
            content: newMessage,
            order_number: dialogues.length + 1,
            type: messageType,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Lỗi khi thêm đoạn hội thoại");
      }

      const data = await response.json();
      setDialogues([...dialogues, data.dialogue]);
      setNewMessage("");
      toast.success("Thêm đoạn hội thoại thành công");
    } catch (error) {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDialogue = async (dialogueId: number) => {
    try {
      const response = await fetch(
        `/api/stories/${storyId}/chapters/${chapterId}/dialogues/${dialogueId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: editContent }),
        }
      );

      if (!response.ok) {
        throw new Error("Lỗi khi cập nhật hội thoại");
      }

      const data = await response.json();
      setDialogues(
        dialogues.map((d) =>
          d.dialogue_id === dialogueId ? { ...d, content: editContent } : d
        )
      );
      setEditingDialogue(null);
      setEditContent("");
      toast.success("Cập nhật hội thoại thành công");
    } catch (error) {
      toast.error("Đã có lỗi xảy ra");
    }
  };

  const handleDeleteDialogue = async (dialogueId: number) => {
    try {
      const response = await fetch(
        `/api/stories/${storyId}/chapters/${chapterId}/dialogues/${dialogueId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Lỗi khi xóa hội thoại");
      }

      setDialogues(dialogues.filter((d) => d.dialogue_id !== dialogueId));
      setDeleteDialogueId(null);
      toast.success("Xóa hội thoại thành công");
    } catch (error) {
      toast.error("Đã có lỗi xảy ra");
    }
  };

  const handleMoveDialogue = async (
    dialogueId: number,
    direction: "up" | "down"
  ) => {
    const currentIndex = dialogues.findIndex(
      (d) => d.dialogue_id === dialogueId
    );
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === dialogues.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const newDialogues = [...dialogues];

    try {
      const response = await fetch(
        `/api/stories/${storyId}/chapters/${chapterId}/dialogues/${dialogueId}/move`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            new_order: newDialogues[newIndex].order_number,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Lỗi khi di chuyển hội thoại");
      }

      // Hoán đổi vị trí trong mảng
      [newDialogues[currentIndex], newDialogues[newIndex]] = [
        newDialogues[newIndex],
        newDialogues[currentIndex],
      ];

      // Cập nhật order_number
      const temp = newDialogues[currentIndex].order_number;
      newDialogues[currentIndex].order_number =
        newDialogues[newIndex].order_number;
      newDialogues[newIndex].order_number = temp;

      setDialogues(newDialogues);
      toast.success("Di chuyển hội thoại thành công");
    } catch (error) {
      toast.error("Đã có lỗi xảy ra");
    }
  };

  // Tạo callback function với useCallback để tránh re-render không cần thiết
  const handleGenerateDialogues = useCallback(async (newDialogues: any[]) => {
    // Thay thế hoàn toàn state hiện tại với danh sách mới
    setGeneratedDialogues(newDialogues);
  }, []);

  // Thêm useEffect để reset state khi mở dialog
  useEffect(() => {
    if (isAIDialogOpen) {
      // Không cần reset generatedDialogues ở đây vì nó sẽ được tải lại từ API
    }
  }, [isAIDialogOpen]);

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

      <div className="container mx-auto px-4 py-6 max-w-7xl min-h-screen relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => {
                startLoading(`/stories/${storyId}?tab=chapters`);
                router.push(`/stories/${storyId}?tab=chapters`);
              }}
              className="flex items-center gap-2 w-full sm:w-auto bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 dark:border-slate-700/50 hover:bg-white/90 dark:hover:bg-slate-800/90 shadow-lg"
            >
              <ChevronLeft className="w-4 h-4" />
              Quản lý chương
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                startLoading(`/stories/${storyId}?tab=characters`);
                router.push(`/stories/${storyId}?tab=characters`);
              }}
              className="flex items-center gap-2 w-full sm:w-auto bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-white/20 dark:border-slate-700/50 hover:bg-white/90 dark:hover:bg-slate-800/90 shadow-lg"
            >
              <Users className="w-4 h-4" />
              Quản lý nhân vật
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsAIDialogOpen(true)}
              className="flex items-center gap-2 w-full sm:w-auto bg-gradient-to-r from-purple-500/80 to-blue-500/80 text-white border-none hover:from-purple-600/90 hover:to-blue-600/90 shadow-lg backdrop-blur-xl"
            >
              <Bot className="w-4 h-4" />
              AI Hỗ trợ
            </Button>
          </div>

          {isLoadingData ? (
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6">
              <Skeleton height={32} width="40%" className="rounded-2xl" />
              <div className="mt-2">
                <Skeleton height={20} width="20%" className="rounded-full" />
              </div>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                <Edit3 className="w-8 h-8 text-blue-600" />
                {chapter?.title || "Đang tải..."}
              </h1>
              <div className="mt-2 flex items-center gap-2">
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    chapter?.status === "published"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                  }`}
                >
                  {chapter?.status === "published"
                    ? "📚 Đã xuất bản"
                    : "✏️ Bản nháp"}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Chat history */}
          <div className="lg:col-span-8 flex flex-col h-[70vh] lg:h-[75vh] overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6">
              {isLoadingData
                ? Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 ${
                          index % 2 === 0 ? "flex-row-reverse" : ""
                        }`}
                      >
                        <Skeleton circle width={40} height={40} />
                        <div
                          className={`flex-1 ${
                            index % 2 === 0 ? "text-right" : ""
                          }`}
                        >
                          <Skeleton
                            width={100}
                            height={20}
                            style={{ marginLeft: index % 2 === 0 ? "auto" : 0 }}
                          />
                          <div
                            className={`mt-1 flex ${
                              index % 2 === 0 ? "justify-end" : "justify-start"
                            }`}
                          >
                            <Skeleton
                              width={200}
                              height={60}
                              style={{ borderRadius: "8px" }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                : dialogues.map((dialogue) => {
                    if (dialogue.type === "aside") {
                      return (
                        <div
                          key={dialogue.dialogue_id}
                          className="my-4 px-8 text-center text-muted-foreground italic group"
                        >
                          {editingDialogue?.dialogue_id ===
                          dialogue.dialogue_id ? (
                            <div className="mt-1">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[60px] text-center italic"
                              />
                              <div className="flex gap-2 mt-2 justify-center">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleEditDialogue(dialogue.dialogue_id)
                                  }
                                >
                                  Lưu
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingDialogue(null);
                                    setEditContent("");
                                  }}
                                >
                                  Hủy
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div>{dialogue.content}</div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 justify-center mt-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    handleMoveDialogue(
                                      dialogue.dialogue_id,
                                      "up"
                                    )
                                  }
                                  disabled={dialogues.indexOf(dialogue) === 0}
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    handleMoveDialogue(
                                      dialogue.dialogue_id,
                                      "down"
                                    )
                                  }
                                  disabled={
                                    dialogues.indexOf(dialogue) ===
                                    dialogues.length - 1
                                  }
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setEditingDialogue(dialogue);
                                    setEditContent(dialogue.content);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() =>
                                    setDeleteDialogueId(dialogue.dialogue_id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    }

                    const character = characters.find(
                      (c) => c.character_id === dialogue.character_id
                    );
                    const isMainCharacter = character?.role === "main";

                    return (
                      <div
                        key={dialogue.dialogue_id}
                        className={`flex items-start gap-3 group ${
                          isMainCharacter ? "flex-row-reverse" : ""
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 shadow-lg ${
                            isMainCharacter
                              ? "border-blue-400 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20"
                              : "border-slate-300 dark:border-slate-600 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800"
                          }`}
                        >
                          {character?.avatar_image ? (
                            <Image
                              src={character.avatar_image}
                              alt={character.name}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          ) : (
                            <User
                              className={`w-7 h-7 m-2.5 ${
                                isMainCharacter
                                  ? "text-blue-600"
                                  : "text-slate-600 dark:text-slate-400"
                              }`}
                            />
                          )}
                        </div>
                        <div
                          className={`flex-1 ${
                            isMainCharacter ? "text-right" : ""
                          }`}
                        >
                          <div
                            className={`font-semibold text-sm mb-1 ${
                              isMainCharacter
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {character?.name}
                            <span className="ml-2 text-xs opacity-70">
                              {isMainCharacter ? "👑" : "🎭"}
                            </span>
                          </div>
                          {editingDialogue?.dialogue_id ===
                          dialogue.dialogue_id ? (
                            <div className="mt-1">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[60px]"
                              />
                              <div className="flex gap-2 mt-2 justify-end">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleEditDialogue(dialogue.dialogue_id)
                                  }
                                >
                                  Lưu
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingDialogue(null);
                                    setEditContent("");
                                  }}
                                >
                                  Hủy
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <div
                                className={`mt-1 ${
                                  isMainCharacter ? "flex justify-end" : ""
                                }`}
                              >
                                <div
                                  className={`inline-block p-4 rounded-2xl break-words whitespace-pre-wrap text-left shadow-lg border ${
                                    isMainCharacter
                                      ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white border-blue-500/20"
                                      : "bg-white/90 dark:bg-slate-700/90 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600"
                                  } max-w-[calc(100%-20px)] backdrop-blur-sm`}
                                >
                                  {dialogue.content}
                                </div>
                              </div>
                              <div
                                className={`opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ${
                                  isMainCharacter
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    handleMoveDialogue(
                                      dialogue.dialogue_id,
                                      "up"
                                    )
                                  }
                                  disabled={dialogues.indexOf(dialogue) === 0}
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    handleMoveDialogue(
                                      dialogue.dialogue_id,
                                      "down"
                                    )
                                  }
                                  disabled={
                                    dialogues.indexOf(dialogue) ===
                                    dialogues.length - 1
                                  }
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setEditingDialogue(dialogue);
                                    setEditContent(dialogue.content);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() =>
                                    setDeleteDialogueId(dialogue.dialogue_id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>

          {/* Character selection and input panel */}
          <div className="lg:col-span-4 flex flex-col h-[70vh] lg:h-[75vh] overflow-hidden">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Viết hội thoại
                </h3>
              </div>

              <Tabs
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as "main" | "supporting")
                }
                className="flex flex-col h-full"
              >
                <TabsList className="mb-4 w-full flex-shrink-0 bg-blue-50/50 dark:bg-blue-900/20">
                  <TabsTrigger
                    value="main"
                    className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    👑 Nhân vật chính
                  </TabsTrigger>
                  <TabsTrigger
                    value="supporting"
                    className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                  >
                    🎭 Nhân vật phụ
                  </TabsTrigger>
                </TabsList>

                <div className="overflow-y-auto flex-1 min-h-0">
                  <TabsContent value="main" className="mt-0 h-full">
                    <div className="grid grid-cols-1 gap-2">
                      {isLoadingData
                        ? Array(3)
                            .fill(0)
                            .map((_, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-2 border rounded-md"
                              >
                                <Skeleton circle width={32} height={32} />
                                <Skeleton width={100} height={20} />
                              </div>
                            ))
                        : mainCharacters.map((character) => (
                            <Button
                              key={character.character_id}
                              variant={
                                selectedCharacter === character.character_id
                                  ? "default"
                                  : "outline"
                              }
                              className={`flex items-center gap-3 w-full justify-start p-3 h-auto rounded-2xl transition-all duration-200 ${
                                selectedCharacter === character.character_id
                                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                                  : "bg-white/50 dark:bg-slate-700/50 hover:bg-white/70 dark:hover:bg-slate-700/70 border-blue-200 dark:border-blue-800"
                              }`}
                              onClick={() =>
                                setSelectedCharacter(character.character_id)
                              }
                            >
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex-shrink-0 border-2 border-blue-200 dark:border-blue-700">
                                {character.avatar_image ? (
                                  <Image
                                    src={character.avatar_image}
                                    alt={character.name}
                                    width={40}
                                    height={40}
                                    className="object-cover"
                                  />
                                ) : (
                                  <User className="w-6 h-6 m-2 text-blue-600" />
                                )}
                              </div>
                              <div className="flex flex-col items-start flex-1 min-w-0">
                                <span className="font-medium truncate w-full text-left">
                                  {character.name}
                                </span>
                                <span className="text-xs opacity-70">
                                  👑 Nhân vật chính
                                </span>
                              </div>
                            </Button>
                          ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="supporting" className="mt-0 h-full">
                    <div className="grid grid-cols-1 gap-2">
                      {isLoadingData
                        ? Array(3)
                            .fill(0)
                            .map((_, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-2 border rounded-md"
                              >
                                <Skeleton circle width={32} height={32} />
                                <Skeleton width={100} height={20} />
                              </div>
                            ))
                        : supportingCharacters.map((character) => (
                            <Button
                              key={character.character_id}
                              variant={
                                selectedCharacter === character.character_id
                                  ? "default"
                                  : "outline"
                              }
                              className={`flex items-center gap-3 w-full justify-start p-3 h-auto rounded-2xl transition-all duration-200 ${
                                selectedCharacter === character.character_id
                                  ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
                                  : "bg-white/50 dark:bg-slate-700/50 hover:bg-white/70 dark:hover:bg-slate-700/70 border-purple-200 dark:border-purple-800"
                              }`}
                              onClick={() =>
                                setSelectedCharacter(character.character_id)
                              }
                            >
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 flex-shrink-0 border-2 border-purple-200 dark:border-purple-700">
                                {character.avatar_image ? (
                                  <Image
                                    src={character.avatar_image}
                                    alt={character.name}
                                    width={40}
                                    height={40}
                                    className="object-cover"
                                  />
                                ) : (
                                  <User className="w-6 h-6 m-2 text-purple-600" />
                                )}
                              </div>
                              <div className="flex flex-col items-start flex-1 min-w-0">
                                <span className="font-medium truncate w-full text-left">
                                  {character.name}
                                </span>
                                <span className="text-xs opacity-70">
                                  🎭 Nhân vật phụ
                                </span>
                              </div>
                            </Button>
                          ))}
                    </div>
                  </TabsContent>
                </div>

                <div className="flex flex-col gap-4 mt-6 flex-shrink-0">
                  <div className="flex gap-2">
                    <Button
                      variant={
                        messageType === "dialogue" ? "default" : "outline"
                      }
                      onClick={() => setMessageType("dialogue")}
                      size="sm"
                      disabled={isLoadingData}
                      className={
                        messageType === "dialogue"
                          ? "bg-blue-600 hover:bg-blue-700"
                          : ""
                      }
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1" />
                      Hội thoại
                    </Button>
                    <Button
                      variant={messageType === "aside" ? "default" : "outline"}
                      onClick={() => setMessageType("aside")}
                      size="sm"
                      disabled={isLoadingData}
                      className={
                        messageType === "aside"
                          ? "bg-purple-600 hover:bg-purple-700"
                          : ""
                      }
                    >
                      <FileText className="h-3.5 w-3.5 mr-1" />
                      Aside
                    </Button>
                  </div>

                  {isLoadingData ? (
                    <Skeleton height={120} className="rounded-2xl" />
                  ) : (
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={
                        messageType === "aside"
                          ? "💭 Nhập nội dung aside (mô tả, tâm trạng, bối cảnh)..."
                          : "💬 Nhập nội dung hội thoại..."
                      }
                      className="resize-none min-h-[120px] rounded-2xl border-blue-200 dark:border-blue-800 focus:border-blue-500 dark:focus:border-blue-400 bg-white/50 dark:bg-slate-700/50"
                    />
                  )}

                  <Button
                    onClick={handleSendMessage}
                    disabled={
                      isLoading ||
                      isLoadingData ||
                      (!selectedCharacter && messageType === "dialogue") ||
                      !newMessage.trim()
                    }
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
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
                        Đang gửi...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Gửi
                      </div>
                    )}
                  </Button>
                </div>
              </Tabs>
            </div>
          </div>
        </motion.div>

        {/* AI Dialog Generator */}
        <DialogueGenerator
          storyContext={{
            title: story?.title || "",
            description: story?.description || "",
            mainCategory: story?.mainCategory || "",
            tags: story?.tags || [],
            characters: characters,
          }}
          chapterTitle={chapter?.title}
          existingDialogues={dialogues
            .filter((d) => d.type === "dialogue" || d.type === "aside")
            .map((d) => ({
              character_id: d.character_id,
              content: d.content,
              type: d.type as "dialogue" | "aside",
            }))}
          onGenerateDialogues={handleGenerateDialogues}
          generatedDialogues={generatedDialogues}
          onAddDialogue={async (dialogue) => {
            setIsLoading(true);
            try {
              const response = await fetch(
                `/api/stories/${storyId}/chapters/${chapterId}/dialogues`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    character_id: dialogue.character_id,
                    content: dialogue.content,
                    order_number: dialogues.length + 1,
                    type: dialogue.type,
                  }),
                }
              );

              if (!response.ok) {
                throw new Error("Lỗi khi thêm đoạn hội thoại");
              }

              const data = await response.json();
              setDialogues([...dialogues, data.dialogue]);

              return Promise.resolve();
            } catch (error) {
              return Promise.reject(error);
            } finally {
              setIsLoading(false);
            }
          }}
          onRemoveDialogue={async (index) => {
            // Không cần xử lý gì ở đây vì đã xử lý trong component DialogueGenerator
            // Hàm này chỉ để truyền vào prop, thực tế xử lý sẽ dùng handleRemoveDialogue trong DialogueGenerator
          }}
          onClearAll={async () => {
            try {
              // Xóa tất cả từ database
              await fetch(
                `/api/stories/${storyId}/chapters/${chapterId}/ai-dialogues?clearAll=true`,
                {
                  method: "DELETE",
                }
              );

              // Cập nhật state
              setGeneratedDialogues([]);
              toast.success("Đã xóa tất cả đoạn hội thoại");
            } catch (error) {
              toast.error("Không thể xóa tất cả đoạn hội thoại");
            }
          }}
          storyId={parseInt(storyId)}
          chapterId={parseInt(chapterId)}
          open={isAIDialogOpen}
          onOpenChange={setIsAIDialogOpen}
          publishedChapters={publishedChapters}
          outlines={outlines}
          chapterSummary={chapter?.summary}
        />

        <AlertDialog
          open={deleteDialogueId !== null}
          onOpenChange={() => setDeleteDialogueId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa đoạn hội thoại này không?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deleteDialogueId && handleDeleteDialogue(deleteDialogueId)
                }
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
