"use client";

import * as React from "react";
import { Header } from "./navbar";
import { useSession } from "next-auth/react";
import { Login } from "../login/login";
import { UserMenu } from "./user-menu";
import { useRouter } from "next/navigation";
import { NotificationBell } from "../notification-bell";

import { useLoading } from "@/providers/loading-provider";

// Chat-themed menu items
const menuItems = [
  {
    text: "🏠 Trang chủ",
    to: "/",
    chatMessage: "Chào mừng bạn đến với ChatStoryAI! 👋",
    icon: "🏠",
  },
  {
    text: "📚 Thư viện truyện",
    chatMessage: "Khám phá kho tàng câu chuyện tuyệt vời! ✨",
    icon: "📚",
    items: [
      {
        text: "🆕 Truyện mới nhất",
        description: "💬 Những câu chuyện vừa được tạo ra bởi cộng đồng",
        to: "/library/new",
        chatStyle: true,
      },
      {
        text: "🔥 Đang thịnh hành",
        description: "❤️ Những truyện được yêu thích nhất tuần này",
        to: "/library/popular",
        chatStyle: true,
      },
      {
        text: "🔍 Tìm kiếm nâng cao",
        description: "🎯 Tìm kiếm truyện theo thể loại, tác giả, từ khóa...",
        to: "/library/search",
        chatStyle: true,
      },
    ],
  },
  {
    text: "✍️ Sáng tác truyện",
    chatMessage: "Hãy cùng tôi tạo ra câu chuyện tuyệt vời! 🚀",
    icon: "✍️",
    items: [
      {
        text: "🎨 Tạo bằng giao diện",
        description: "🖱️ Sử dụng editor trực quan để viết truyện",
        to: "/stories/create",
        chatStyle: true,
      },
      {
        text: "🤖 Trò chuyện với AI",
        description: "💭 Để AI giúp bạn phát triển ý tưởng thành câu chuyện",
        to: "/ai",
        chatStyle: true,
        featured: true,
      },
    ],
  },
  {
    text: "💡 Hỗ trợ & Hướng dẫn",
    chatMessage: "Tôi sẽ giúp bạn sử dụng ChatStoryAI hiệu quả! 🎓",
    icon: "💡",
    items: [
      {
        text: "📖 Cách sử dụng",
        description: "🎯 Hướng dẫn từng bước để bắt đầu viết truyện",
        to: "/guide/basic",
        chatStyle: true,
      },
      {
        text: "❓ Câu hỏi thường gặp",
        description: "💬 Giải đáp những thắc mắc phổ biến",
        to: "/guide/faq",
        chatStyle: true,
      },
      {
        text: "📞 Liên hệ hỗ trợ",
        description: "🆘 Cần giúp đỡ? Chúng tôi luôn sẵn sàng!",
        to: "/contact",
        chatStyle: true,
      },
    ],
  },
];

// Theme switcher demo
const Nav = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  const { startLoading } = useLoading();

  React.useEffect(() => {
    // Get initial theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme as "light" | "dark");
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark");
  };

  const handleLogoClick = () => {
    startLoading("/");
    router.push("/");
  };

  return (
    <>
      <div
        className={`w-full ${
          theme === "dark" ? "dark bg-[#0B0C0F]" : "bg-white"
        }`}
      >
        <Header
          theme={theme}
          logo={
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2 text-xl font-bold transition-all duration-300 group"
            >
              <span className="text-2xl group-hover:animate-bounce">💬</span>
              <span className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700">
                ChatStoryAI
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              </span>
            </button>
          }
          menuItems={menuItems}
          onThemeChange={toggleTheme}
          isSticky={true}
          isStickyOverlay={true}
          rightContent={
            <div className="flex items-center gap-3">
              {session ? (
                <>
                  <NotificationBell />
                  <UserMenu isDarkTheme={theme === "dark"} />
                </>
              ) : (
                <Login />
              )}
            </div>
          }
        />
      </div>
    </>
  );
};

// Export all variants
export { Nav };
