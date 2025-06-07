"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChatBubble } from "@/components/ui/chat-bubble"
import { Badge } from "@/components/ui/badge"
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const testimonials = [
  {
    id: 1,
    name: "Minh Anh",
    role: "Tác giả truyện ngắn",
    avatar: "/default-user.webp",
    rating: 5,
    story: "Truyện Fantasy",
    messages: [
      {
        message: "ChatStory AI đã giúp tôi vượt qua writer's block! Từ một ý tưởng mơ hồ, AI đã giúp tôi phát triển thành một câu chuyện hoàn chỉnh.",
        isUser: true,
        timestamp: "2 phút trước"
      },
      {
        message: "Thật tuyệt vời! Bạn đã tạo ra một thế giới fantasy rất độc đáo. Hãy tiếp tục phát triển những nhân vật thú vị này nhé! ✨",
        isUser: false,
        timestamp: "1 phút trước"
      }
    ]
  },
  {
    id: 2,
    name: "Đức Thành",
    role: "Học sinh lớp 12",
    avatar: "/default-user.webp",
    rating: 5,
    story: "Truyện Khoa học viễn tưởng",
    messages: [
      {
        message: "Lần đầu tiên tôi viết truyện và AI đã hướng dẫn tôi từng bước một cách rất chi tiết và dễ hiểu.",
        isUser: true,
        timestamp: "5 phút trước"
      },
      {
        message: "Bạn có tài năng viết lách! Ý tưởng về du hành thời gian của bạn rất sáng tạo. Hãy khám phá thêm những hệ quả thú vị nhé! 🚀",
        isUser: false,
        timestamp: "3 phút trước"
      }
    ]
  },
  {
    id: 3,
    name: "Thu Hà",
    role: "Blogger",
    avatar: "/default-user.webp",
    rating: 5,
    story: "Truyện Tình yêu",
    messages: [
      {
        message: "AI hiểu được phong cách viết của tôi và đưa ra những gợi ý rất phù hợp. Câu chuyện tình yêu của tôi trở nên sống động hơn nhiều!",
        isUser: true,
        timestamp: "10 phút trước"
      },
      {
        message: "Cảm xúc trong câu chuyện của bạn rất chân thật! Những tình tiết bạn tạo ra thực sự chạm đến trái tim người đọc. 💕",
        isUser: false,
        timestamp: "8 phút trước"
      }
    ]
  },
  {
    id: 4,
    name: "Hoàng Nam",
    role: "Nhà văn nghiệp dư",
    avatar: "/default-user.webp",
    rating: 5,
    story: "Truyện Trinh thám",
    messages: [
      {
        message: "Tôi đã viết được 5 chương đầu tiên của tiểu thuyết trinh thám nhờ sự hỗ trợ của AI. Cốt truyện chặt chẽ và hấp dẫn!",
        isUser: true,
        timestamp: "15 phút trước"
      },
      {
        message: "Bạn đã tạo ra những manh mối rất thông minh! Kẻ thủ ác trong câu chuyện của bạn thực sự bí ẩn và khó đoán. 🕵️",
        isUser: false,
        timestamp: "12 phút trước"
      }
    ]
  }
]

export function ChatTestimonials() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    setIsAutoPlaying(false)
  }

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    setIsAutoPlaying(false)
  }

  const current = testimonials[currentTestimonial]

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-green-900/10 dark:via-blue-900/10 dark:to-purple-900/10" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">
            <Quote className="w-3 h-3 mr-1" />
            Câu Chuyện Thành Công
          </Badge>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Người Dùng Nói Gì
            </span>
            <br />
            <span className="text-foreground">Về ChatStory AI</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Hàng nghìn tác giả đã tin tưởng và sử dụng ChatStory AI để biến ý tưởng thành những câu chuyện tuyệt vời
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Testimonial Info */}
          <motion.div
            key={currentTestimonial}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                {current.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold">{current.name}</h3>
                <p className="text-muted-foreground">{current.role}</p>
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: current.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            </div>

            {/* Story Badge */}
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              📚 {current.story}
            </Badge>

            {/* Quote */}
            <div className="relative">
              <Quote className="absolute -top-2 -left-2 w-8 h-8 text-muted-foreground/20" />
              <blockquote className="text-lg leading-relaxed pl-6">
                "{current.messages[0].message}"
              </blockquote>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentTestimonial(index)
                      setIsAutoPlaying(false)
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentTestimonial
                        ? "bg-blue-500 w-8"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevTestimonial}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextTestimonial}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Chat Interface */}
          <motion.div
            key={`chat-${currentTestimonial}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-6 border-b border-border/50 bg-gradient-to-r from-green-500/10 to-blue-500/10">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <div className="flex-1 text-center">
                  <h4 className="font-semibold">Cuộc trò chuyện với {current.name}</h4>
                  <p className="text-xs text-muted-foreground">ChatStory AI</p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="p-6 space-y-4 h-80">
                <AnimatePresence mode="wait">
                  {current.messages.map((msg, index) => (
                    <motion.div
                      key={`${currentTestimonial}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.3 }}
                    >
                      <ChatBubble
                        message={msg.message}
                        isUser={msg.isUser}
                        name={msg.isUser ? current.name : "ChatStory AI"}
                        timestamp={msg.timestamp}
                        delay={0}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 text-center"
        >
          <div>
            <div className="text-3xl font-bold text-green-600">98%</div>
            <div className="text-sm text-muted-foreground">Hài lòng</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">1000+</div>
            <div className="text-sm text-muted-foreground">Câu chuyện</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">500+</div>
            <div className="text-sm text-muted-foreground">Tác giả</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-pink-600">24/7</div>
            <div className="text-sm text-muted-foreground">Hỗ trợ</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
