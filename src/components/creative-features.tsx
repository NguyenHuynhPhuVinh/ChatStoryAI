"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Brain,
  Wand2,
  Users,
  Zap,
  BookOpen,
  Sparkles,
  Heart,
  ArrowRight,
  Play,
  RotateCcw,
} from "lucide-react";
import { ChatBubble } from "@/components/ui/chat-bubble";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const features = [
  {
    id: 1,
    title: "Trò Chuyện Tự Nhiên",
    description: "Giao tiếp với AI như bạn bè thật",
    icon: MessageSquare,
    color: "from-blue-500 to-cyan-500",
    demo: [
      { message: "Tôi muốn viết truyện tình yêu", isUser: true },
      {
        message:
          "Tuyệt vời! Hãy bắt đầu với nhân vật chính. Họ là ai và tại sao họ đặc biệt? 💕",
        isUser: false,
      },
      {
        message:
          "Một cô gái tên Linh, làm việc tại thư viện và yêu thích sách cổ",
        isUser: true,
      },
      {
        message:
          "Thật thú vị! Linh sẽ gặp ai trong thư viện? Có thể là một người bí ẩn đang tìm kiếm cuốn sách đặc biệt? ✨",
        isUser: false,
      },
    ],
    interactive: true,
    emoji: "💬",
  },
  {
    id: 2,
    title: "AI Thông Minh",
    description: "Hiểu ngữ cảnh và phong cách viết",
    icon: Brain,
    color: "from-purple-500 to-pink-500",
    demo: [
      { message: "Hãy phân tích nhân vật Linh cho tôi", isUser: true },
      {
        message:
          "Dựa trên mô tả của bạn, Linh có vẻ là người nội tâm, yêu thích tri thức. Tôi đề xuất phát triển:",
        isUser: false,
      },
      {
        message:
          "• Tính cách: Nhút nhát nhưng có trái tim ấm áp\n• Sở thích: Đọc sách cổ, uống trà\n• Xung đột: Giữa thế giới sách và thực tế 🤔",
        isUser: false,
      },
    ],
    interactive: true,
    emoji: "🧠",
  },
  {
    id: 3,
    title: "Sáng Tạo Vô Hạn",
    description: "Tạo ra vô số ý tưởng mới",
    icon: Wand2,
    color: "from-yellow-500 to-orange-500",
    demo: [
      { message: "Tôi bí ý tưởng cho cốt truyện", isUser: true },
      {
        message: "Đây là 3 ý tưởng sáng tạo cho câu chuyện của bạn:",
        isUser: false,
      },
      {
        message:
          "🌟 Cuốn sách cổ có phép thuật, đưa Linh vào thế giới khác\n⚡ Người lạ là nhà văn nổi tiếng ẩn danh\n🔮 Thư viện là cổng thời gian, mỗi cuốn sách là một kỷ nguyên",
        isUser: false,
      },
    ],
    interactive: true,
    emoji: "🪄",
  },
  {
    id: 4,
    title: "Cộng Đồng Sôi Động",
    description: "Chia sẻ và khám phá cùng nhau",
    icon: Users,
    color: "from-green-500 to-emerald-500",
    stats: { stories: "1000+", authors: "500+", likes: "10K+" },
    interactive: false,
    emoji: "👥",
  },
];

export function CreativeFeatures() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [showTyping, setShowTyping] = useState(false);

  const handleFeatureClick = (index: number) => {
    setActiveFeature(index);
    setVisibleMessages([]);
    setShowTyping(false);
    setIsPlaying(false);
  };

  const startDemo = () => {
    if (!features[activeFeature].interactive || !features[activeFeature].demo)
      return;

    setIsPlaying(true);
    setVisibleMessages([]);
    setShowTyping(false);

    const messages = features[activeFeature].demo!;
    let currentDelay = 0;

    messages.forEach((msg, index) => {
      if (!msg.isUser && index > 0) {
        // Show typing indicator before AI response
        setTimeout(() => {
          setShowTyping(true);
        }, currentDelay);

        currentDelay += 1500; // Typing duration

        setTimeout(() => {
          setShowTyping(false);
          setVisibleMessages((prev) => [...prev, index]);
        }, currentDelay);

        currentDelay += 500; // Pause after message
      } else {
        setTimeout(() => {
          setVisibleMessages((prev) => [...prev, index]);
        }, currentDelay);

        currentDelay += msg.isUser ? 1000 : 2000; // Different timing for user vs AI
      }
    });

    setTimeout(() => {
      setIsPlaying(false);
    }, currentDelay + 500);
  };

  const resetDemo = () => {
    setIsPlaying(false);
    setVisibleMessages([]);
    setShowTyping(false);
  };

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20" />

        {/* Floating Orbs */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-32 h-32 rounded-full blur-3xl opacity-20"
            style={{
              background: `linear-gradient(45deg, ${
                ["#3B82F6", "#8B5CF6", "#F59E0B", "#10B981"][i % 4]
              }, transparent)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, 100, -50, 0],
              y: [0, -100, 50, 0],
              scale: [1, 1.2, 0.8, 1],
            }}
            transition={{
              duration: 10 + Math.random() * 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge
            variant="outline"
            className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200 dark:from-blue-900/20 dark:to-purple-900/20 dark:text-blue-300 dark:border-blue-700"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Tính Năng Sáng Tạo
          </Badge>

          <h2 className="text-3xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Khám Phá Sức Mạnh
            </span>
            <br />
            <span className="text-foreground">Của AI Sáng Tạo</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Trải nghiệm những tính năng độc đáo giúp việc viết truyện trở nên
            thú vị và dễ dàng hơn bao giờ hết
          </p>
        </motion.div>

        {/* Interactive Feature Showcase */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Feature List */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                onClick={() => handleFeatureClick(index)}
                className={`
                  relative p-6 rounded-3xl cursor-pointer transition-all duration-500
                  ${
                    activeFeature === index
                      ? "bg-white/90 dark:bg-slate-800/90 shadow-2xl scale-105"
                      : "bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-800/70"
                  }
                  backdrop-blur-xl border border-white/20 dark:border-slate-700/50
                  group hover:scale-102 transform-gpu
                `}
              >
                {/* Active Indicator */}
                {activeFeature === index && (
                  <motion.div
                    layoutId="activeIndicator"
                    className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${feature.color} opacity-10`}
                    transition={{ duration: 0.3 }}
                  />
                )}

                <div className="relative flex items-center gap-4">
                  {/* Icon */}
                  <motion.div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <feature.icon size={28} />
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-1 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>

                  {/* Emoji & Arrow */}
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{feature.emoji}</span>
                    {feature.interactive && (
                      <motion.div
                        animate={{ x: activeFeature === index ? 5 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Feature Demo */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
              {/* Demo Header */}
              <div
                className={`p-6 border-b border-border/50 bg-gradient-to-r ${features[activeFeature].color}/10`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <h4 className="font-semibold flex-1 text-center">
                    {features[activeFeature].title}
                  </h4>
                  <span className="text-2xl">
                    {features[activeFeature].emoji}
                  </span>
                </div>
              </div>

              {/* Demo Content */}
              <div className="flex flex-col h-96">
                {/* Chat Messages Area with Scroll */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeFeature}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {features[activeFeature].demo ? (
                        <div className="space-y-4">
                          <AnimatePresence>
                            {features[activeFeature].demo!.map(
                              (msg, i) =>
                                (visibleMessages.includes(i) || !isPlaying) && (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                                    transition={{
                                      duration: 0.5,
                                      type: "spring",
                                      stiffness: 100,
                                    }}
                                  >
                                    <ChatBubble
                                      message={msg.message}
                                      isUser={msg.isUser}
                                      name={msg.isUser ? "Bạn" : "ChatStory AI"}
                                      delay={0}
                                    />
                                  </motion.div>
                                )
                            )}

                            {/* Typing Indicator */}
                            {showTyping && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="flex justify-start"
                              >
                                <div className="bg-white dark:bg-slate-700 rounded-2xl px-4 py-3 shadow-sm border">
                                  <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                      {[0, 1, 2].map((i) => (
                                        <motion.div
                                          key={i}
                                          className="w-2 h-2 bg-muted-foreground/60 rounded-full"
                                          animate={{
                                            scale: [1, 1.2, 1],
                                            opacity: [0.5, 1, 0.5],
                                          }}
                                          transition={{
                                            duration: 1,
                                            repeat: Infinity,
                                            delay: i * 0.2,
                                          }}
                                        />
                                      ))}
                                    </div>
                                    <span className="text-xs text-muted-foreground ml-2">
                                      AI đang suy nghĩ...
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : features[activeFeature].stats ? (
                        <div className="grid grid-cols-3 gap-6 text-center h-full items-center">
                          {Object.entries(features[activeFeature].stats!).map(
                            ([key, value], i) => (
                              <motion.div
                                key={key}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="space-y-2"
                              >
                                <div
                                  className={`text-3xl font-bold bg-gradient-to-r ${features[activeFeature].color} bg-clip-text text-transparent`}
                                >
                                  {value}
                                </div>
                                <div className="text-sm text-muted-foreground capitalize">
                                  {key === "stories"
                                    ? "Truyện"
                                    : key === "authors"
                                    ? "Tác giả"
                                    : "Yêu thích"}
                                </div>
                              </motion.div>
                            )
                          )}
                        </div>
                      ) : null}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Demo Controls - Fixed at bottom */}
                {features[activeFeature].interactive && (
                  <div className="border-t border-border/50 p-4 bg-gradient-to-r from-muted/30 to-muted/10">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="flex justify-center gap-3"
                    >
                      <Button
                        size="sm"
                        variant={isPlaying ? "default" : "outline"}
                        onClick={isPlaying ? resetDemo : startDemo}
                        disabled={isPlaying}
                        className={`${
                          isPlaying
                            ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg"
                            : "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-md"
                        } transition-all duration-300`}
                      >
                        {isPlaying ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="mr-2"
                            >
                              <Sparkles className="w-4 h-4" />
                            </motion.div>
                            Đang chạy...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Chạy Demo
                          </>
                        )}
                      </Button>

                      {visibleMessages.length > 0 && !isPlaying && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={resetDemo}
                          className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/20 transition-all duration-300"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset
                        </Button>
                      )}
                    </motion.div>
                  </div>
                )}
              </div>
            </div>

            {/* Floating Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 }}
              className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
            >
              ✨ Tương tác
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="w-4 h-4 text-red-500" />
            <span>
              Được yêu thích bởi hàng nghìn người dùng trên toàn thế giới
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
