"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Github,
  Mail,
  Heart,
  Sparkles,
  MessageCircle,
  BookOpen,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLoading } from "@/providers/loading-provider";

function Footer() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const { startLoading } = useLoading();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Vui lòng nhập đúng định dạng email");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Đăng ký nhận thông tin thành công!");
        setEmail("");
      } else {
        toast.error(data.error || "Đã có lỗi xảy ra. Vui lòng thử lại sau.");
      }
    } catch (error) {
      console.error("Lỗi khi đăng ký:", error);
      toast.error("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20 py-16">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
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

      <div className="container mx-auto max-w-6xl px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                ChatStoryAI
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md">
                Biến ý tưởng thành câu chuyện tuyệt vời qua cuộc trò chuyện tự
                nhiên với AI. Khơi dậy tiềm năng sáng tạo của bạn cùng chúng
                tôi.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { icon: MessageCircle, label: "Trò chuyện", value: "1000+" },
                { icon: BookOpen, label: "Truyện", value: "500+" },
                { icon: Heart, label: "Yêu thích", value: "10K+" },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="text-center p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/20 dark:border-slate-700/50"
                >
                  <stat.icon className="w-5 h-5 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Liên kết nhanh
            </h4>
            <nav className="space-y-3">
              {[
                { label: "Trang chủ", path: "/" },
                { label: "Thư viện", path: "/library/new" },
                { label: "Tạo truyện", path: "/stories/create" },
                { label: "API Docs", path: "/docs" },
                { label: "Liên hệ", path: "/contact" },
              ].map((link, index) => (
                <button
                  key={index}
                  onClick={() => {
                    startLoading(link.path);
                    router.push(link.path);
                  }}
                  className="block text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 text-sm"
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </motion.div>

          {/* Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Nhận thông tin mới
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Đăng ký để nhận những tính năng và câu chuyện mới nhất
            </p>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="email" className="sr-only">
                  Email
                </Label>
                <Input
                  id="email"
                  placeholder="Email của bạn"
                  type="email"
                  className="rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                disabled={isLoading}
              >
                <Mail className="w-4 h-4 mr-2" />
                {isLoading ? "Đang xử lý..." : "Đăng ký"}
              </Button>
            </form>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-12 pt-8 border-t border-white/20 dark:border-slate-700/50"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Social Links */}
            <div className="flex space-x-4">
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
                {
                  icon: Instagram,
                  url: "https://www.instagram.com/",
                  label: "Instagram",
                },
              ].map((social, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.open(social.url, "_blank")}
                  className="w-10 h-10 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
                >
                  <social.icon className="w-5 h-5" />
                  <span className="sr-only">{social.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Copyright */}
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                © {currentYear} ChatStoryAI. Tạo với
                <Heart className="w-4 h-4 text-red-500" />
                bởi đội ngũ sáng tạo
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Khơi dậy tiềm năng sáng tạo của bạn
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

export { Footer };
