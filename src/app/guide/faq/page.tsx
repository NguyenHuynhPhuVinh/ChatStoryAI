"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  HelpCircle,
  Users,
  Shield,
  Rocket,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLoading } from "@/providers/loading-provider";

export default function FAQPage() {
  const router = useRouter();
  const { startLoading } = useLoading();

  const handleNavigation = (path: string) => {
    startLoading(path);
    router.push(path);
  };

  const faqCategories = [
    {
      icon: "🤖",
      title: "AI & Trò Chuyện",
      color: "from-blue-500 to-cyan-500",
      questions: [
        {
          question: "AI có thể hiểu được ý tưởng của tôi không?",
          answer:
            "Có! AI của chúng tôi được huấn luyện để hiểu và phát triển ý tưởng câu chuyện từ mô tả đơn giản nhất. Bạn chỉ cần chia sẻ ý tưởng cơ bản, AI sẽ đặt câu hỏi để hiểu rõ hơn và giúp bạn phát triển thành câu chuyện hoàn chỉnh.",
        },
        {
          question: "Tôi có thể trò chuyện bằng tiếng Việt không?",
          answer:
            "Tất nhiên! ChatStoryAI hỗ trợ đầy đủ tiếng Việt. Bạn có thể trò chuyện, tạo truyện và tương tác hoàn toàn bằng tiếng Việt một cách tự nhiên.",
        },
        {
          question: "AI có thể tạo ra những thể loại truyện nào?",
          answer:
            "AI có thể hỗ trợ tạo mọi thể loại: tình cảm, phiêu lưu, kinh dị, khoa học viễn tưởng, fantasy, trinh thám, hài hước và nhiều thể loại khác. Chỉ cần nói với AI thể loại bạn muốn!",
        },
      ],
    },
    {
      icon: "📝",
      title: "Tạo & Viết Truyện",
      color: "from-green-500 to-emerald-500",
      questions: [
        {
          question: "Làm sao để bắt đầu viết truyện đầu tiên?",
          answer:
            "Rất đơn giản! Bạn có thể bắt đầu bằng cách trò chuyện với AI về ý tưởng của mình, hoặc sử dụng editor để viết trực tiếp. AI sẽ hỗ trợ bạn phát triển cốt truyện, nhân vật và tạo ra nội dung hấp dẫn.",
        },
        {
          question: "Tôi có thể chỉnh sửa truyện sau khi tạo không?",
          answer:
            "Có! Bạn có thể chỉnh sửa, bổ sung, xóa bất kỳ phần nào của truyện. Hệ thống lưu tự động giúp bạn không lo mất dữ liệu.",
        },
        {
          question: "Có giới hạn độ dài truyện không?",
          answer:
            "Không có giới hạn cứng về độ dài. Bạn có thể viết từ truyện ngắn vài trang đến tiểu thuyết dài hàng trăm chương. Hệ thống được tối ưu để xử lý mọi quy mô.",
        },
      ],
    },
    {
      icon: "👥",
      title: "Cộng Đồng & Chia Sẻ",
      color: "from-purple-500 to-pink-500",
      questions: [
        {
          question: "Làm sao để chia sẻ truyện với mọi người?",
          answer:
            "Sau khi hoàn thành, bạn có thể xuất bản truyện lên thư viện công cộng. Độc giả có thể tìm thấy, đọc và tương tác với tác phẩm của bạn.",
        },
        {
          question: "Tôi có thể nhận phản hồi từ độc giả không?",
          answer:
            "Có! Độc giả có thể bình luận, đánh giá và chia sẻ cảm nhận về truyện của bạn. Điều này giúp bạn cải thiện kỹ năng viết và tạo ra những tác phẩm tốt hơn.",
        },
        {
          question: "Truyện của tôi có được bảo vệ bản quyền không?",
          answer:
            "Bạn giữ toàn quyền sở hữu trí tuệ đối với nội dung mình tạo ra. Chúng tôi chỉ cung cấp nền tảng để bạn sáng tạo và chia sẻ.",
        },
      ],
    },
    {
      icon: "⚙️",
      title: "Tính Năng & Hỗ Trợ",
      color: "from-orange-500 to-red-500",
      questions: [
        {
          question: "Tôi có thể sử dụng miễn phí không?",
          answer:
            "Có! ChatStoryAI cung cấp nhiều tính năng miễn phí để bạn bắt đầu. Chúng tôi cũng có các gói premium với tính năng nâng cao cho người dùng chuyên nghiệp.",
        },
        {
          question: "Dữ liệu của tôi có an toàn không?",
          answer:
            "Tuyệt đối! Chúng tôi sử dụng mã hóa cao cấp và tuân thủ các tiêu chuẩn bảo mật quốc tế để bảo vệ dữ liệu của bạn.",
        },
        {
          question: "Tôi gặp lỗi thì liên hệ ai?",
          answer:
            "Bạn có thể liên hệ team hỗ trợ qua email hoặc chat trực tiếp. Chúng tôi cam kết phản hồi trong vòng 24h và hỗ trợ tận tình.",
        },
      ],
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
                <HelpCircle className="w-3 h-3 mr-1" />
                Câu Hỏi Thường Gặp
              </Badge>

              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Giải Đáp
                </span>
                <br />
                <span className="text-foreground">Mọi Thắc Mắc</span>
              </h1>

              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Tìm câu trả lời cho những câu hỏi phổ biến về ChatStoryAI. Nếu
                không tìm thấy câu trả lời, đừng ngại liên hệ với chúng tôi!
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
                  onClick={() => handleNavigation("/contact")}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Liên Hệ Hỗ Trợ
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => handleNavigation("/guide/basic")}
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Xem Hướng Dẫn
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {faqCategories.map((category, categoryIndex) => (
                <motion.div
                  key={categoryIndex}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <Card className="h-full relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
                    {/* Gradient Background */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}
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
                        {category.icon}
                      </motion.div>
                      <CardTitle className="text-xl group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                        {category.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="relative">
                      <Accordion type="single" collapsible className="w-full">
                        {category.questions.map((faq, faqIndex) => (
                          <AccordionItem
                            key={faqIndex}
                            value={`item-${categoryIndex}-${faqIndex}`}
                          >
                            <AccordionTrigger className="text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                              {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                              {faq.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
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

              <h2 className="text-3xl font-bold">Vẫn còn thắc mắc?</h2>

              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn! Liên hệ
                ngay để được tư vấn chi tiết.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => handleNavigation("/contact")}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Liên Hệ Hỗ Trợ
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  onClick={() => handleNavigation("/ai")}
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Thử Ngay
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
