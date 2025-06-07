"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChatBubble } from "@/components/ui/chat-bubble"
import { Badge } from "@/components/ui/badge"
import { Star, Quote, ArrowRight, MessageCircle } from "lucide-react"

const testimonials = [
  {
    id: 1,
    name: "Minh Anh",
    role: "Tác giả truyện ngắn",
    avatar: "/default-user.webp",
    rating: 5,
    story: "Truyện Fantasy",
    color: "from-purple-500 to-pink-500",
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
    color: "from-blue-500 to-cyan-500",
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
    color: "from-pink-500 to-rose-500",
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
    color: "from-green-500 to-emerald-500",
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

export function CreativeTestimonials() {
  const [selectedTestimonial, setSelectedTestimonial] = useState(0)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-green-900/10 dark:via-blue-900/10 dark:to-purple-900/10" />
        
        {/* Animated Shapes */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-20 blur-2xl"
            style={{
              background: `linear-gradient(45deg, ${
                ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'][i]
              }, transparent)`,
              width: `${100 + Math.random() * 100}px`,
              height: `${100 + Math.random() * 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, 50, -30, 0],
              y: [0, -50, 30, 0],
              scale: [1, 1.2, 0.8, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
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
          <Badge variant="outline" className="mb-4 bg-gradient-to-r from-green-50 to-blue-50 text-green-700 border-green-200 dark:from-green-900/20 dark:to-blue-900/20 dark:text-green-300 dark:border-green-700">
            <Quote className="w-3 h-3 mr-1" />
            Câu Chuyện Thành Công
          </Badge>
          
          <h2 className="text-3xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Người Dùng Yêu Thích
            </span>
            <br />
            <span className="text-foreground">ChatStory AI</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Hàng nghìn tác giả đã tin tưởng và sử dụng ChatStory AI để biến ý tưởng thành những câu chuyện tuyệt vời
          </p>
        </motion.div>

        {/* Testimonials Masonry Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20, rotateY: -15 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.05, 
                rotateY: 5,
                z: 50
              }}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => setSelectedTestimonial(index)}
              className={`
                relative p-6 rounded-3xl cursor-pointer transition-all duration-500 transform-gpu
                ${selectedTestimonial === index 
                  ? 'bg-white dark:bg-slate-800 shadow-2xl ring-2 ring-blue-500/50' 
                  : 'bg-white/80 dark:bg-slate-800/80 hover:bg-white/95 dark:hover:bg-slate-800/95'
                }
                backdrop-blur-xl border border-white/20 dark:border-slate-700/50
                group perspective-1000
              `}
              style={{
                transformStyle: "preserve-3d",
              }}
            >
              {/* Gradient Border Effect */}
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${testimonial.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-sm`} />
              
              {/* Selection Indicator */}
              {selectedTestimonial === index && (
                <motion.div
                  layoutId="selectedIndicator"
                  className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
                  transition={{ duration: 0.3 }}
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                </motion.div>
              )}

              {/* User Avatar */}
              <div className="relative mb-4">
                <motion.div 
                  className={`w-16 h-16 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white text-xl font-bold mx-auto shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  {testimonial.name.charAt(0)}
                </motion.div>
                
                {/* Floating Emoji */}
                <motion.div
                  className="absolute -top-2 -right-2 text-2xl"
                  animate={{ 
                    rotate: hoveredCard === index ? [0, 10, -10, 0] : 0,
                    scale: hoveredCard === index ? [1, 1.2, 1] : 1
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {index === 0 ? "🧙‍♀️" : index === 1 ? "🚀" : index === 2 ? "💕" : "🕵️"}
                </motion.div>
              </div>

              {/* User Info */}
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg">{testimonial.name}</h3>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Story Badge */}
              <Badge variant="secondary" className={`w-full justify-center mb-4 bg-gradient-to-r ${testimonial.color}/10 border-0`}>
                📚 {testimonial.story}
              </Badge>

              {/* Quote Preview */}
              <div className="relative">
                <Quote className="absolute -top-1 -left-1 w-4 h-4 text-muted-foreground/30" />
                <p className="text-sm leading-relaxed pl-4 line-clamp-3">
                  "{testimonial.messages[0].message}"
                </p>
              </div>

              {/* Hover Effect */}
              <motion.div
                className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                animate={{ 
                  x: selectedTestimonial === index ? [0, 5, 0] : 0,
                }}
                transition={{ 
                  duration: 1,
                  repeat: selectedTestimonial === index ? Infinity : 0
                }}
              >
                <div className={`w-8 h-8 bg-gradient-to-r ${testimonial.color} rounded-full flex items-center justify-center text-white shadow-lg`}>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Selected Testimonial Chat */}
        <motion.div
          key={selectedTestimonial}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden max-w-4xl mx-auto"
        >
          {/* Chat Header */}
          <div className={`p-6 border-b border-border/50 bg-gradient-to-r ${testimonials[selectedTestimonial].color}/10`}>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
              <div className="flex-1 text-center">
                <h4 className="font-semibold">Cuộc trò chuyện với {testimonials[selectedTestimonial].name}</h4>
                <p className="text-xs text-muted-foreground">ChatStory AI</p>
              </div>
              <div className="flex items-center gap-2">
                {testimonials.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setSelectedTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === selectedTestimonial
                        ? "bg-blue-500 scale-125"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    }`}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="p-6 space-y-4 min-h-[300px]">
            <AnimatePresence mode="wait">
              {testimonials[selectedTestimonial].messages.map((msg, index) => (
                <motion.div
                  key={`${selectedTestimonial}-${index}`}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.3, duration: 0.5 }}
                >
                  <ChatBubble
                    message={msg.message}
                    isUser={msg.isUser}
                    name={msg.isUser ? testimonials[selectedTestimonial].name : "ChatStory AI"}
                    timestamp={msg.timestamp}
                    delay={0}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 text-center"
        >
          {[
            { value: "98%", label: "Hài lòng", color: "text-green-600" },
            { value: "1000+", label: "Câu chuyện", color: "text-blue-600" },
            { value: "500+", label: "Tác giả", color: "text-purple-600" },
            { value: "24/7", label: "Hỗ trợ", color: "text-pink-600" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="space-y-2"
            >
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
