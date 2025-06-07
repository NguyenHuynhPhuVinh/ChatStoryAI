"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChatBubble, TypingIndicator } from "@/components/ui/chat-bubble"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw, Sparkles } from "lucide-react"

const demoConversations = [
  {
    id: 1,
    title: "Viết Truyện Phiêu Lưu",
    messages: [
      { id: 1, message: "Tôi muốn viết một câu chuyện phiêu lưu trong rừng Amazon", isUser: true, delay: 0 },
      { id: 2, message: "Tuyệt vời! Hãy bắt đầu với nhân vật chính. Họ là ai và tại sao lại đến Amazon?", isUser: false, delay: 2 },
      { id: 3, message: "Một nhà khảo cổ học trẻ tên Alex, đang tìm kiếm một thành phố cổ đại bị mất tích", isUser: true, delay: 4 },
      { id: 4, message: "Hoàn hảo! Alex sẽ gặp những thử thách gì trong hành trình? Có thể là động vật hoang dã, thời tiết khắc nghiệt, hoặc những bí ẩn cổ đại...", isUser: false, delay: 6 }
    ]
  },
  {
    id: 2,
    title: "Phát Triển Nhân Vật",
    messages: [
      { id: 1, message: "Làm thế nào để tạo ra một nhân vật phản diện thú vị?", isUser: true, delay: 0 },
      { id: 2, message: "Nhân vật phản diện tốt nhất thường có động cơ hợp lý! Họ nghĩ mình đang làm điều đúng. Bạn muốn nhân vật của mình có động cơ gì?", isUser: false, delay: 2 },
      { id: 3, message: "Một nhà khoa học muốn cứu thế giới bằng cách kiểm soát thời tiết", isUser: true, delay: 4 },
      { id: 4, message: "Tuyệt! Đó là động cơ cao cả nhưng phương pháp có thể gây tranh cãi. Hãy khám phá quá khứ của họ - điều gì đã khiến họ tin rằng kiểm soát là cách duy nhất?", isUser: false, delay: 6 }
    ]
  },
  {
    id: 3,
    title: "Xây Dựng Thế Giới",
    messages: [
      { id: 1, message: "Tôi cần giúp đỡ để tạo ra một thế giới fantasy độc đáo", isUser: true, delay: 0 },
      { id: 2, message: "Hãy bắt đầu với hệ thống ma thuật! Nó hoạt động như thế nào trong thế giới của bạn? Có giới hạn gì không?", isUser: false, delay: 2 },
      { id: 3, message: "Ma thuật đến từ cảm xúc, nhưng sử dụng quá nhiều sẽ làm mất đi ký ức", isUser: true, delay: 4 },
      { id: 4, message: "Ý tưởng tuyệt vời! Điều này tạo ra xung đột nội tâm thú vị. Các pháp sư phải chọn giữa sức mạnh và ký ức. Hãy nghĩ về xã hội - họ đối xử với pháp sư như thế nào?", isUser: false, delay: 6 }
    ]
  }
]

export function ChatDemo() {
  const [currentDemo, setCurrentDemo] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [visibleMessages, setVisibleMessages] = useState<number[]>([])
  const [showTyping, setShowTyping] = useState(false)

  const currentConversation = demoConversations[currentDemo]

  const startDemo = () => {
    setIsPlaying(true)
    setVisibleMessages([])
    setShowTyping(false)

    currentConversation.messages.forEach((msg, index) => {
      setTimeout(() => {
        if (index > 0 && !currentConversation.messages[index - 1].isUser) {
          setShowTyping(true)
          setTimeout(() => {
            setShowTyping(false)
            setVisibleMessages(prev => [...prev, msg.id])
          }, 1000)
        } else {
          setVisibleMessages(prev => [...prev, msg.id])
        }
      }, msg.delay * 1000)
    })

    setTimeout(() => {
      setIsPlaying(false)
    }, (currentConversation.messages[currentConversation.messages.length - 1].delay + 2) * 1000)
  }

  const resetDemo = () => {
    setIsPlaying(false)
    setVisibleMessages([])
    setShowTyping(false)
  }

  const nextDemo = () => {
    resetDemo()
    setCurrentDemo((prev) => (prev + 1) % demoConversations.length)
  }

  useEffect(() => {
    resetDemo()
  }, [currentDemo])

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/10 dark:via-blue-900/10 dark:to-indigo-900/10" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700">
            <Sparkles className="w-3 h-3 mr-1" />
            Demo Tương Tác
          </Badge>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Xem AI Hoạt Động
            </span>
            <br />
            <span className="text-foreground">Trong Thực Tế</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Khám phá cách ChatStory AI giúp bạn phát triển ý tưởng và xây dựng câu chuyện một cách tự nhiên
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Demo Controls */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-2xl font-bold mb-4">Chọn Kịch Bản Demo</h3>
              <div className="space-y-3">
                {demoConversations.map((demo, index) => (
                  <button
                    key={demo.id}
                    onClick={() => setCurrentDemo(index)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                      currentDemo === index
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : "border-border hover:border-purple-300 dark:hover:border-purple-700"
                    }`}
                  >
                    <div className="font-semibold text-lg">{demo.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {demo.messages.length} tin nhắn
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={isPlaying ? resetDemo : startDemo}
                disabled={isPlaying}
                className="flex-1"
                size="lg"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Đang Chạy...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Bắt Đầu Demo
                  </>
                )}
              </Button>
              
              <Button
                onClick={resetDemo}
                variant="outline"
                size="lg"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💡 Mẹo Sử Dụng
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Hãy mô tả ý tưởng của bạn một cách tự nhiên</li>
                <li>• AI sẽ đặt câu hỏi để hiểu rõ hơn</li>
                <li>• Cùng nhau phát triển câu chuyện từng bước</li>
              </ul>
            </div>
          </motion.div>

          {/* Chat Interface */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-6 border-b border-border/50 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="flex-1 text-center">
                  <h4 className="font-semibold">{currentConversation.title}</h4>
                  <p className="text-xs text-muted-foreground">ChatStory AI</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="p-6 h-96 overflow-y-auto space-y-4">
                <AnimatePresence>
                  {currentConversation.messages.map((msg) => (
                    visibleMessages.includes(msg.id) && (
                      <ChatBubble
                        key={msg.id}
                        message={msg.message}
                        isUser={msg.isUser}
                        name={msg.isUser ? "Bạn" : "ChatStory AI"}
                        delay={0}
                      />
                    )
                  ))}
                  
                  {showTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white dark:bg-slate-700 rounded-2xl px-4 py-3 shadow-sm border">
                        <TypingIndicator />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Chat Input (Disabled) */}
              <div className="p-4 border-t border-border/50 bg-muted/30">
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-2 bg-background/50 border border-border/50 rounded-xl text-muted-foreground">
                    Nhập tin nhắn của bạn...
                  </div>
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
