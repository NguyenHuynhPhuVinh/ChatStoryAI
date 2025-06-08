"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Sparkles,
  BookOpen,
  ArrowRight,
  Play,
  Heart,
  Star,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLoading } from "@/providers/loading-provider";

export default function BasicGuidePage() {
  const router = useRouter();
  const { startLoading } = useLoading();

  const handleNavigation = (path: string) => {
    startLoading(path);
    router.push(path);
  };

  const guides = [
    {
      icon: "💬",
      title: "Trò Chuyện với AI",
      description:
        "Bắt đầu cuộc trò chuyện tự nhiên với AI để tạo ra câu chuyện tuyệt vời",
      steps: [
        "Mô tả ý tưởng câu chuyện của bạn",
        "AI sẽ đặt câu hỏi để hiểu rõ hơn",
        "Cùng nhau phát triển cốt truyện",
        "Tạo ra những đoạn hội thoại sinh động",
      ],
      color: "from-blue-500 to-cyan-500",
      featured: true,
      action: () => handleNavigation("/ai"),
    },
    {
      icon: "📚",
      title: "Khám Phá Thư Viện",
      description: "Đọc những câu chuyện tuyệt vời được tạo bởi cộng đồng",
      steps: [
        "Duyệt qua thư viện truyện đa dạng",
        "Tìm kiếm theo thể loại yêu thích",
        "Đánh dấu truyện để đọc sau",
        "Tương tác với tác giả và độc giả khác",
      ],
      color: "from-purple-500 to-pink-500",
      action: () => handleNavigation("/library/new"),
    },
    {
      icon: "✍️",
      title: "Sáng Tác Truyện",
      description: "Tạo truyện bằng giao diện trực quan và dễ sử dụng",
      steps: [
        "Tạo truyện mới với tiêu đề hấp dẫn",
        "Thêm ảnh bìa và mô tả",
        "Viết các chương với editor thông minh",
        "Xuất bản để chia sẻ với mọi người",
      ],
      color: "from-green-500 to-emerald-500",
      action: () => handleNavigation("/stories/create"),
    },
    {
      icon: "👥",
      title: "Quản Lý Nhân Vật",
      description: "Tạo và phát triển các nhân vật sống động trong truyện",
      steps: [
        "Thiết kế ngoại hình và tính cách",
        "Xây dựng background và động cơ",
        "Tạo mối quan hệ giữa các nhân vật",
        "Phát triển nhân vật qua từng chương",
      ],
      color: "from-orange-500 to-red-500",
    },
    {
      icon: "🎯",
      title: "Tối Ưu Nội Dung",
      description: "Sử dụng AI để cải thiện chất lượng câu chuyện",
      steps: [
        "Phân tích cấu trúc câu chuyện",
        "Nhận gợi ý cải thiện từ AI",
        "Tối ưu hóa đoạn hội thoại",
        "Hoàn thiện cốt truyện",
      ],
      color: "from-indigo-500 to-purple-500",
    },
    {
      icon: "🚀",
      title: "Chia Sẻ & Phát Triển",
      description: "Xuất bản và xây dựng cộng đồng độc giả",
      steps: [
        "Xuất bản truyện hoàn chỉnh",
        "Theo dõi thống kê và phản hồi",
        "Tương tác với độc giả",
        "Phát triển thương hiệu cá nhân",
      ],
      color: "from-pink-500 to-rose-500",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20">
          {/* Background Effects */}
          <div className="absolute inset-0">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-32 h-32 rounded-full blur-3xl opacity-20"
                style={{
                  background: `linear-gradient(45deg, ${
                    [
                      "#3B82F6",
                      "#8B5CF6",
                      "#F59E0B",
                      "#10B981",
                      "#EF4444",
                      "#EC4899",
                    ][i]
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

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-6 mb-16"
            >
              <Badge
                variant="outline"
                className="mb-4 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700"
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Hướng Dẫn Sử Dụng
              </Badge>

              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Cách Sử Dụng
                </span>
                <br />
                <span className="text-foreground">ChatStoryAI</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Khám phá cách tạo ra những câu chuyện tuyệt vời thông qua trò
                chuyện với AI. Từ ý tưởng đến tác phẩm hoàn chỉnh, chúng tôi sẽ
                hướng dẫn bạn từng bước.
              </p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => handleNavigation("/ai")}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Bắt Đầu Ngay
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => handleNavigation("/library/new")}
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Xem Ví Dụ
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Guides Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {guides.map((guide, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <Card className="h-full relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                    {/* Featured Badge */}
                    {guide.featured && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-4 right-4 z-10"
                      >
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          Nổi bật
                        </Badge>
                      </motion.div>
                    )}

                    {/* Gradient Background */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${guide.color} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}
                    />

                    <CardHeader className="relative">
                      <motion.div
                        className="text-4xl mb-4"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        }}
                      >
                        {guide.icon}
                      </motion.div>
                      <CardTitle className="text-xl group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                        {guide.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="relative space-y-4">
                      <p className="text-muted-foreground leading-relaxed">
                        {guide.description}
                      </p>

                      {/* Steps */}
                      <div className="space-y-2">
                        {guide.steps.map((step, stepIndex) => (
                          <motion.div
                            key={stepIndex}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: stepIndex * 0.1 }}
                            className="flex items-start gap-3 text-sm"
                          >
                            <div
                              className={`w-6 h-6 rounded-full bg-gradient-to-r ${guide.color} flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5`}
                            >
                              {stepIndex + 1}
                            </div>
                            <span className="text-muted-foreground">
                              {step}
                            </span>
                          </motion.div>
                        ))}
                      </div>

                      {/* Action Button */}
                      {guide.action && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="pt-4"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={guide.action}
                            className="w-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors"
                          >
                            Thử ngay
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center space-y-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl p-12 border border-white/20 dark:border-slate-700/50"
            >
              <div className="flex justify-center mb-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  <Zap className="w-5 h-5 text-blue-500" />
                </div>
              </div>

              <h2 className="text-3xl font-bold">
                Sẵn sàng tạo câu chuyện đầu tiên?
              </h2>

              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Bắt đầu cuộc trò chuyện với AI ngay bây giờ và khám phá sức mạnh
                của việc sáng tạo truyện thông qua chat!
              </p>

              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => handleNavigation("/ai")}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Trò Chuyện với AI
              </Button>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
