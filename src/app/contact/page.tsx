/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  Clock,
  Users,
  Heart,
  Sparkles,
  Github,
  Facebook,
  Twitter,
} from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import emailjs from "@emailjs/browser";
import { toast } from "sonner";

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await emailjs.send(
        "service_migewp5", // Thay thế bằng Service ID của bạn
        "template_ibjlr5j", // Thay thế bằng Template ID của bạn
        {
          from_name: formData.name,
          from_email: formData.email,
          message: formData.message,
          to_email: "chatstoryai@gmail.com",
        },
        "sezXfvR3C4eXA3-Qb" // Thay thế bằng Public Key của bạn
      );

      toast.success("Tin nhắn của bạn đã được gửi thành công.");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      toast.error("Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20" />

        {/* Floating Orbs */}
        {[...Array(8)].map((_, i) => (
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
                  "#F97316",
                  "#EC4899",
                ][i % 6]
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

      <main className="relative z-10 py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge
              variant="outline"
              className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200 dark:from-blue-900/20 dark:to-purple-900/20 dark:text-blue-300 dark:border-blue-700"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Liên Hệ Với Chúng Tôi
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Hãy Kết Nối
              </span>
              <br />
              <span className="text-foreground">Cùng Chúng Tôi</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Chúng tôi luôn sẵn sàng lắng nghe ý kiến, hỗ trợ và cùng bạn tạo
              nên những câu chuyện tuyệt vời
            </p>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info Cards */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-1 space-y-6"
            >
              {/* Contact Methods */}
              {[
                {
                  icon: Mail,
                  title: "Email",
                  value: "chatstoryai@gmail.com",
                  description: "Gửi email cho chúng tôi bất cứ lúc nào",
                  color: "from-blue-500 to-cyan-500",
                },
                {
                  icon: Phone,
                  title: "Điện thoại",
                  value: "0762605309",
                  description: "Liên hệ trực tiếp qua điện thoại",
                  color: "from-green-500 to-emerald-500",
                },
                {
                  icon: MapPin,
                  title: "Địa chỉ",
                  value: "Trường Đại Học Trà Vinh",
                  description: "DA22TTC - Nhóm Báo Cáo CNPM",
                  color: "from-purple-500 to-pink-500",
                },
              ].map((contact, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-r ${contact.color} flex items-center justify-center shadow-lg`}
                    >
                      <contact.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {contact.title}
                      </h3>
                      <p className="text-gray-900 dark:text-white font-medium mb-1">
                        {contact.value}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {contact.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50"
              >
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Thống Kê
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Users, label: "Người dùng", value: "1000+" },
                    { icon: Clock, label: "Phản hồi", value: "<24h" },
                  ].map((stat, index) => (
                    <div key={index} className="text-center">
                      <stat.icon className="w-6 h-6 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="lg:col-span-2"
            >
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-slate-700/50 shadow-xl">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Send className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    Gửi Tin Nhắn
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Hãy chia sẻ với chúng tôi ý tưởng, góp ý hoặc câu hỏi của
                    bạn
                  </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid md:grid-cols-2 gap-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="space-y-2"
                    >
                      <Label
                        htmlFor="name"
                        className="text-gray-900 dark:text-white font-medium"
                      >
                        Họ và tên
                      </Label>
                      <Input
                        id="name"
                        placeholder="Nhập họ và tên của bạn"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="rounded-xl bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border-white/20 dark:border-slate-600/50 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                        required
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="space-y-2"
                    >
                      <Label
                        htmlFor="email"
                        className="text-gray-900 dark:text-white font-medium"
                      >
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="rounded-xl bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border-white/20 dark:border-slate-600/50 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                        required
                      />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-2"
                  >
                    <Label
                      htmlFor="message"
                      className="text-gray-900 dark:text-white font-medium"
                    >
                      Nội dung
                    </Label>
                    <TextareaAutosize
                      id="message"
                      placeholder="Hãy chia sẻ với chúng tôi ý tưởng, góp ý hoặc câu hỏi của bạn..."
                      minRows={6}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                      className="flex w-full rounded-xl border border-white/20 dark:border-slate-600/50 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-none"
                      required
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <Button
                      type="submit"
                      className="w-full py-6 text-lg font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={isLoading}
                    >
                      <Send className="w-5 h-5 mr-2" />
                      {isLoading ? "Đang gửi..." : "Gửi tin nhắn"}
                    </Button>
                  </motion.div>
                </form>

                {/* Social Links */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="mt-8 pt-6 border-t border-gray-200/50 dark:border-slate-700/50"
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
                    Hoặc kết nối với chúng tôi qua:
                  </p>
                  <div className="flex justify-center gap-4">
                    {[
                      {
                        icon: Github,
                        url: "https://github.com/NguyenHuynhPhuVinh-TomiSakae/ChatStoryAI",
                        label: "GitHub",
                      },
                      {
                        icon: Facebook,
                        url: "https://www.facebook.com/",
                        label: "Facebook",
                      },
                      {
                        icon: Twitter,
                        url: "https://twitter.com/",
                        label: "Twitter",
                      },
                    ].map((social, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.open(social.url, "_blank")}
                        className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <social.icon className="w-5 h-5" />
                        <span className="sr-only">{social.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
