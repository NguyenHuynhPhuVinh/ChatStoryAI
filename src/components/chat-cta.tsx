"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChatBubble } from "@/components/ui/chat-bubble";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Sparkles,
  ArrowRight,
  BookOpen,
  Users,
  Zap,
  Heart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLoading } from "@/providers/loading-provider";

const ctaMessages = [
  {
    id: 1,
    message: "Sẵn sàng bắt đầu hành trình sáng tạo của bạn chưa? 🚀",
    isUser: false,
    delay: 0,
  },
  {
    id: 2,
    message: "Tôi đã sẵn sàng! Hãy giúp tôi viết câu chuyện đầu tiên nhé!",
    isUser: true,
    delay: 2,
  },
  {
    id: 3,
    message: "Tuyệt vời! Hãy bắt đầu ngay thôi! ✨",
    isUser: false,
    delay: 4,
  },
];

const features = [
  {
    icon: MessageCircle,
    title: "Trò chuyện tự nhiên",
    description: "Như bạn bè thật",
  },
  {
    icon: Sparkles,
    title: "AI thông minh",
    description: "Hiểu ý tưởng của bạn",
  },
  {
    icon: BookOpen,
    title: "Thư viện phong phú",
    description: "Hàng nghìn mẫu truyện",
  },
  {
    icon: Users,
    title: "Cộng đồng sôi động",
    description: "Chia sẻ và học hỏi",
  },
];

export function ChatCTA() {
  const router = useRouter();
  const { startLoading } = useLoading();
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDemo(true);
      ctaMessages.forEach((msg) => {
        setTimeout(() => {
          setVisibleMessages((prev) => [...prev, msg.id]);
        }, msg.delay * 1000);
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20" />

      {/* Interactive Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, 50, -30, 20, 0],
              y: [0, -40, 30, -20, 0],
              rotate: [0, 180, 360],
              scale: [1, 1.5, 0.8, 1.2, 1],
              opacity: [0.2, 0.8, 0.4, 0.9, 0.2],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 3,
            }}
          >
            {i % 4 === 0 ? (
              <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-sm" />
            ) : i % 4 === 1 ? (
              <div className="w-6 h-6 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full blur-md" />
            ) : i % 4 === 2 ? (
              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full" />
            ) : (
              <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full blur-sm" />
            )}
          </motion.div>
        ))}

        {/* Larger Morphing Shapes */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`shape-${i}`}
            className="absolute rounded-full blur-3xl opacity-10"
            style={{
              background: `linear-gradient(45deg, ${
                ["#3B82F6", "#8B5CF6", "#F59E0B", "#10B981"][i]
              }, transparent)`,
              width: `${150 + Math.random() * 100}px`,
              height: `${150 + Math.random() * 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.3, 0.7, 1.1, 1],
              rotate: [0, 90, 180, 270, 360],
              x: [0, 100, -50, 30, 0],
              y: [0, -80, 60, -30, 0],
            }}
            transition={{
              duration: 12 + Math.random() * 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <Badge
                variant="outline"
                className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200 dark:from-blue-900/20 dark:to-purple-900/20 dark:text-blue-300 dark:border-blue-700"
              >
                <Heart className="w-3 h-3 mr-1 text-red-500" />
                Tham Gia Ngay
              </Badge>

              <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Bắt Đầu Viết Truyện
                </span>
                <br />
                <span className="text-foreground">Ngay Hôm Nay</span>
              </h2>

              <p className="text-xl text-muted-foreground leading-relaxed">
                Tham gia cùng hàng nghìn tác giả đã tin tưởng ChatStory AI. Biến
                ý tưởng của bạn thành những câu chuyện tuyệt vời!
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-white/20 dark:border-slate-700/50"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                    <feature.icon size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{feature.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {feature.description}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                onClick={() => {
                  startLoading("/stories");
                  router.push("/stories");
                }}
              >
                <MessageCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Bắt Đầu Ngay
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="border-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 group"
                onClick={() => {
                  startLoading("/library/new");
                  router.push("/library/new");
                }}
              >
                <BookOpen className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Khám Phá Truyện
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              className="flex items-center gap-6 pt-4 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>Miễn phí sử dụng</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-500" />
                <span>1000+ người dùng</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span>98% hài lòng</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Chat Demo */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-6 border-b border-border/50 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="flex-1 text-center">
                  <h4 className="font-semibold">Bắt đầu cuộc trò chuyện</h4>
                  <p className="text-xs text-muted-foreground">ChatStory AI</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="p-6 h-64 flex flex-col justify-center">
                {showDemo ? (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {ctaMessages.map(
                        (msg) =>
                          visibleMessages.includes(msg.id) && (
                            <ChatBubble
                              key={msg.id}
                              message={msg.message}
                              isUser={msg.isUser}
                              name={msg.isUser ? "Bạn" : "ChatStory AI"}
                              delay={0}
                            />
                          )
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                    </motion.div>
                    <p>Chuẩn bị demo...</p>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-border/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20">
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-2 bg-background/50 border border-border/50 rounded-xl text-muted-foreground text-sm">
                    Nhập ý tưởng câu chuyện của bạn...
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2, duration: 0.5 }}
              className="absolute -top-4 -right-4 bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg"
            >
              ✨ Miễn phí
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
