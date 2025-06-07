"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Star,
  Zap,
  Heart,
  Gift,
  Crown,
  Sparkles,
  Coffee,
  Users,
  Shield,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { handleVNPayPayment } from "@/lib/vnpay";

const pricingPlans = [
  {
    id: "free",
    name: "Gói Miễn Phí",
    price: "0đ",
    originalPrice: null,
    period: "Mãi mãi",
    description: "Hoàn hảo để bắt đầu hành trình sáng tạo",
    icon: Gift,
    color: "from-blue-500 to-cyan-500",
    features: [
      "Truy cập tất cả tính năng cơ bản",
      "Không giới hạn thời gian sử dụng",
      "Cập nhật tính năng mới thường xuyên",
      "Hỗ trợ qua cộng đồng",
      "Không cần thanh toán",
    ],
    isPopular: false,
    badge: "Miễn phí",
    buttonText: "Bắt đầu ngay",
    buttonIcon: Zap,
  },
  {
    id: "supporter",
    name: "Gói Ủng Hộ",
    price: "22.000đ",
    originalPrice: "50.000đ",
    period: "Một lần",
    description: "Ủng hộ dự án và nhận thêm nhiều tính năng",
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    features: [
      "Tất cả tính năng của gói miễn phí",
      "Truy cập sớm tính năng mới",
      "Chế độ tạo truyện bằng AI chat",
      "Hỗ trợ phát triển dự án",
      "Góp phần duy trì máy chủ",
      "Nhận khung avatar ủng hộ",
      "Hỗ trợ ưu tiên",
    ],
    isPopular: true,
    badge: "Phổ biến nhất",
    buttonText: "Ủng hộ ngay",
    buttonIcon: Coffee,
  },
  {
    id: "free-supporter",
    name: "Gói Ủng Hộ Miễn Phí",
    price: "0đ",
    originalPrice: null,
    period: "Mãi mãi",
    description: "Ủng hộ tinh thần và nhận badge đặc biệt",
    icon: Crown,
    color: "from-purple-500 to-indigo-500",
    features: [
      "Truy cập sớm tính năng mới",
      "Chế độ tạo truyện bằng AI chat",
      "Nhận khung avatar ủng hộ",
      "Hỗ trợ phát triển dự án",
      "Không cần thanh toán",
      "Badge người ủng hộ",
    ],
    isPopular: false,
    badge: "Đặc biệt",
    buttonText: "Ủng hộ miễn phí",
    buttonIcon: Star,
  },
];

export function PricingSection() {
  const { data: session, update } = useSession();

  const handlePayment = async (plan: (typeof pricingPlans)[0]) => {
    if (plan.price === "0đ") {
      if (plan.id === "free-supporter") {
        await handleFreeSupporterUpgrade();
      } else {
        toast.success("Bạn đã có thể sử dụng miễn phí!");
      }
      return;
    }

    if (!session) {
      toast.error("Vui lòng đăng nhập để ủng hộ dự án");
      return;
    }

    try {
      const amount = 22000;
      const orderInfo = `Thanh toán ${plan.name}`;

      await handleVNPayPayment({
        amount,
        orderInfo,
      });
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Có lỗi xảy ra khi xử lý thanh toán");
    }
  };

  const handleFreeSupporterUpgrade = async () => {
    if (!session) {
      toast.error("Vui lòng đăng nhập để trở thành người ủng hộ");
      return;
    }

    try {
      await fetch("/api/user/update-badge", {
        method: "POST",
      });

      await update({ hasBadge: true });
      toast.success("Bạn đã trở thành người ủng hộ!");
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      toast.error("Có lỗi xảy ra khi xử lý yêu cầu");
    }
  };

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background Effects - Match landing page style */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20" />

        {/* Floating Orbs - Similar to creative-features */}
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

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge
            variant="outline"
            className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200 dark:from-blue-900/20 dark:to-purple-900/20 dark:text-blue-300 dark:border-blue-700"
          >
            <Coffee className="w-4 h-4 mr-2" />
            Bảng Giá
          </Badge>

          <h2 className="text-3xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Chọn Gói
            </span>
            <br />
            <span className="text-foreground">Phù Hợp</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Bạn có thể sử dụng miễn phí hoặc ủng hộ chúng tôi một tách cafe ☕
            <br />
            Mọi đóng góp đều giúp dự án phát triển bền vững!
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10"
                >
                  <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-1 shadow-lg">
                    <Star className="w-3 h-3 mr-1" />
                    {plan.badge}
                  </Badge>
                </motion.div>
              )}

              <motion.div
                className={`relative h-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl border-2 overflow-hidden ${
                  plan.isPopular
                    ? "border-pink-200 dark:border-pink-700 shadow-xl shadow-pink-500/10"
                    : "border-white/20 dark:border-slate-700/50 shadow-lg"
                }`}
              >
                {/* Card Header */}
                <div
                  className={`p-8 text-center bg-gradient-to-r ${plan.color}/10 border-b border-gray-200/50 dark:border-gray-700/50`}
                >
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${plan.color} flex items-center justify-center shadow-lg`}
                  >
                    <plan.icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>

                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline justify-center gap-2">
                    {plan.originalPrice && (
                      <span className="text-lg text-gray-400 line-through">
                        {plan.originalPrice}
                      </span>
                    )}
                    <span
                      className={`text-4xl font-bold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}
                    >
                      {plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      /{plan.period}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="p-8">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        viewport={{ once: true }}
                        className="flex items-start gap-3"
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center flex-shrink-0 mt-0.5`}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                          {feature}
                        </span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handlePayment(plan)}
                    className={`w-full py-6 text-lg font-semibold ${
                      plan.isPopular
                        ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg"
                        : "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                    }`}
                  >
                    <plan.buttonIcon className="w-5 h-5 mr-2" />
                    {plan.buttonText}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Users, label: "Người dùng hài lòng", value: "1000+" },
              { icon: Shield, label: "Bảo mật tuyệt đối", value: "100%" },
              { icon: Sparkles, label: "Tính năng mới", value: "Hàng tuần" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                viewport={{ once: true }}
                className="flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
