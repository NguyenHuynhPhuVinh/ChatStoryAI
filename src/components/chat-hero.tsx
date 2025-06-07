"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChatBubble } from "@/components/ui/chat-bubble"
import { Badge } from "@/components/ui/badge"
import { Sparkles, MessageCircle, Zap, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLoading } from "@/providers/loading-provider"

const chatMessages = [
  {
    id: 1,
    message: "Tôi muốn viết một câu chuyện về phiêu lưu trong không gian 🚀",
    isUser: true,
    name: "Bạn",
    delay: 0
  },
  {
    id: 2,
    message: "Tuyệt vời! Hãy bắt đầu với nhân vật chính. Họ là ai và tại sao lại muốn khám phá vũ trụ?",
    isUser: false,
    name: "ChatStory AI",
    delay: 1.5
  },
  {
    id: 3,
    message: "Một phi hành gia trẻ tên Maya, luôn mơ ước tìm kiếm sự sống ngoài Trái Đất",
    isUser: true,
    name: "Bạn", 
    delay: 3
  },
  {
    id: 4,
    message: "Hoàn hảo! Tôi sẽ giúp bạn phát triển câu chuyện của Maya. Cô ấy sẽ khám phá hành tinh bí ẩn nào đầu tiên? ✨",
    isUser: false,
    name: "ChatStory AI",
    delay: 4.5
  }
]

const floatingElements = [
  { icon: MessageCircle, delay: 0, position: "top-20 left-10" },
  { icon: Sparkles, delay: 1, position: "top-32 right-20" },
  { icon: Zap, delay: 2, position: "bottom-40 left-20" },
  { icon: BookOpen, delay: 3, position: "bottom-20 right-10" }
]

export function ChatHero() {
  const router = useRouter()
  const { startLoading } = useLoading()
  const [visibleMessages, setVisibleMessages] = useState<number[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      chatMessages.forEach((msg, index) => {
        setTimeout(() => {
          setVisibleMessages(prev => [...prev, msg.id])
        }, msg.delay * 1000)
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20" />
      
      {/* Floating Chat Bubbles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingElements.map((element, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 0.6, 0.3],
              scale: [0, 1.2, 1],
              y: [0, -20, 0]
            }}
            transition={{
              duration: 4,
              delay: element.delay,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className={`absolute ${element.position} text-blue-400/30 dark:text-blue-300/20`}
          >
            <element.icon size={40} />
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge variant="outline" className="mb-4 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
                <Sparkles className="w-3 h-3 mr-1" />
                Powered by AI
              </Badge>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Trò Chuyện
                </span>
                <br />
                <span className="text-foreground">
                  Sáng Tạo Truyện
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Biến ý tưởng thành câu chuyện tuyệt vời qua cuộc trò chuyện tự nhiên với AI
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => {
                  startLoading('/stories')
                  router.push('/stories')
                }}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Bắt Đầu Trò Chuyện
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={() => {
                  startLoading('/library/new')
                  router.push('/library/new')
                }}
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Khám Phá Truyện
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex gap-8 pt-8"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">1000+</div>
                <div className="text-sm text-muted-foreground">Câu chuyện</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">500+</div>
                <div className="text-sm text-muted-foreground">Tác giả</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">24/7</div>
                <div className="text-sm text-muted-foreground">AI Hỗ trợ</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Chat Demo */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-6 max-w-md mx-auto">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="ml-auto text-sm font-medium text-muted-foreground">ChatStory AI</span>
              </div>

              <div className="space-y-4 h-80 overflow-hidden">
                <AnimatePresence>
                  {chatMessages.map((msg) => (
                    visibleMessages.includes(msg.id) && (
                      <ChatBubble
                        key={msg.id}
                        message={msg.message}
                        isUser={msg.isUser}
                        name={msg.name}
                        delay={0}
                      />
                    )
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
