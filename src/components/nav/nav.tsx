"use client";

import * as React from "react";
import { Header } from "./navbar";
import { useSession } from "next-auth/react";
import { Login } from "../login/login";
import { UserMenu } from "./user-menu";
import { useRouter } from "next/navigation";
import { NotificationBell } from "../notification-bell";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { SearchDialog } from "../search-dialog";
import { useLoading } from "@/providers/loading-provider";

// Sample menu items
const menuItems = [
  {
    text: "Trang chủ",
    to: "/",
  },
  {
    text: "Thư viện",
    items: [
      {
        text: "Truyện mới",
        description: "Những truyện mới được tạo",
        to: "/library/new",
      },
      {
        text: "Phổ biến",
        description: "Những truyện được yêu thích nhất",
        to: "/library/popular",
      },
      {
        text: "Tìm kiếm",
        description: "Tìm kiếm nâng cao",
        to: "/library/search",
      },
    ],
  },
  {
    text: "Tạo truyện",
    items: [
      {
        text: "Tạo bằng giao diện",
        description: "Tạo truyện bằng giao diện trực quan",
        to: "/stories/create",
      },
      {
        text: "Tạo bằng AI",
        description: "Tạo truyện thông qua trò chuyện với AI",
        to: "/ai",
      },
    ],
  },
  {
    text: "Hướng dẫn",
    items: [
      {
        text: "Cách sử dụng",
        description: "Hướng dẫn sử dụng cơ bản",
        to: "/guide/basic",
      },
      {
        text: "Câu hỏi thường gặp",
        description: "Các câu hỏi thường gặp",
        to: "/guide/faq",
      },
    ],
  },
];

// Theme switcher demo
const Nav = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const [searchOpen, setSearchOpen] = React.useState(false);
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
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
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
              className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-300"
            >
              ChatStoryAI
            </button>
          }
          menuItems={menuItems}
          onThemeChange={toggleTheme}
          isSticky={true}
          isStickyOverlay={true}
          rightContent={
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-5 h-5" />
              </Button>
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
