"use client"

import React from "react"
import { motion } from "framer-motion"
import { 
  MessageSquare, 
  Brain, 
  Wand2, 
  Users, 
  Zap, 
  BookOpen,
  Sparkles,
  Heart
} from "lucide-react"
import { ChatBubble } from "@/components/ui/chat-bubble"
import { Badge } from "@/components/ui/badge"

const features = [
  {
    id: 1,
    title: "Trò Chuyện Tự Nhiên",
    description: "Giao tiếp với AI như bạn bè thật",
    icon: MessageSquare,
    size: "large",
    demo: [
      { message: "Tôi muốn viết truyện tình yêu", isUser: true },
      { message: "Hãy kể về nhân vật chính nhé!", isUser: false }
    ]
  },
  {
    id: 2,
    title: "AI Thông Minh",
    description: "Hiểu ngữ cảnh và phong cách viết",
    icon: Brain,
    size: "medium",
    demo: [
      { message: "Phân tích tính cách nhân vật...", isUser: false }
    ]
  },
  {
    id: 3,
    title: "Sáng Tạo Không Giới Hạn",
    description: "Tạo ra vô số ý tưởng mới",
    icon: Wand2,
    size: "medium",
    demo: [
      { message: "✨ Ý tưởng mới: Phép thuật thời gian", isUser: false }
    ]
  },
  {
    id: 4,
    title: "Cộng Đồng Sôi Động",
    description: "Chia sẻ và khám phá cùng nhau",
    icon: Users,
    size: "large",
    stats: { stories: "1000+", authors: "500+", likes: "10K+" }
  },
  {
    id: 5,
    title: "Tốc Độ Nhanh",
    description: "Phản hồi tức thì",
    icon: Zap,
    size: "small"
  },
  {
    id: 6,
    title: "Thư Viện Phong Phú",
    description: "Hàng nghìn mẫu truyện",
    icon: BookOpen,
    size: "small"
  }
]

function FeatureCard({ feature, index }: { feature: typeof features[0], index: number }) {
  const sizeClasses = {
    small: "col-span-1 row-span-1",
    medium: "col-span-1 row-span-2 md:col-span-2 md:row-span-1",
    large: "col-span-1 row-span-2 md:col-span-2 md:row-span-2"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className={`
        ${sizeClasses[feature.size]}
        group relative overflow-hidden rounded-2xl border border-border/50
        bg-gradient-to-br from-white/80 to-white/40 
        dark:from-slate-800/80 dark:to-slate-900/40
        backdrop-blur-sm hover:shadow-xl transition-all duration-300
        hover:border-blue-200 dark:hover:border-blue-700
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
            <feature.icon size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {feature.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {feature.description}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center">
          {feature.demo && (
            <div className="space-y-3">
              {feature.demo.map((msg, i) => (
                <ChatBubble
                  key={i}
                  message={msg.message}
                  isUser={msg.isUser}
                  delay={i * 0.5}
                  className="max-w-full"
                />
              ))}
            </div>
          )}

          {feature.stats && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{feature.stats.stories}</div>
                <div className="text-xs text-muted-foreground">Truyện</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{feature.stats.authors}</div>
                <div className="text-xs text-muted-foreground">Tác giả</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-pink-600">{feature.stats.likes}</div>
                <div className="text-xs text-muted-foreground">Yêu thích</div>
              </div>
            </div>
          )}

          {!feature.demo && !feature.stats && (
            <div className="flex items-center justify-center h-20">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="text-4xl"
              >
                {feature.id === 5 ? "⚡" : "📚"}
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function ChatFeatures() {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/30 to-transparent dark:via-blue-900/10" />
      
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
            <Sparkles className="w-3 h-3 mr-1" />
            Tính Năng Nổi Bật
          </Badge>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Trải Nghiệm Sáng Tạo
            </span>
            <br />
            <span className="text-foreground">Hoàn Toàn Mới</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Khám phá những tính năng độc đáo giúp việc viết truyện trở nên thú vị và dễ dàng hơn bao giờ hết
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-fr">
          {features.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="w-4 h-4 text-red-500" />
            <span>Được yêu thích bởi hàng nghìn người dùng</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
