"use client";

import * as React from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  LogOut,
  User,
  BookOpen,
  Settings,
  MessageCircle,
  Sparkles,
  Heart,
} from "lucide-react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { UserAvatar } from "@/components/user-avatar";
import { useLoading } from "@/providers/loading-provider";

interface UserMenuProps {
  isDarkTheme?: boolean;
  isMobile?: boolean;
  onMobileMenuClose?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  isDarkTheme,
  isMobile,
  onMobileMenuClose,
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = React.useState(false);
  const { startLoading } = useLoading();

  if (!session) return null;

  const handleNavigation = (path: string) => {
    startLoading(path);
    router.push(path);
    if (isMobile && onMobileMenuClose) {
      onMobileMenuClose();
    }
  };

  const handleSignOut = () => {
    startLoading("/");
    if (isMobile && onMobileMenuClose) {
      onMobileMenuClose();
    }
    signOut({ callbackUrl: "/" });
  };

  if (isMobile) {
    return (
      <div className="px-2 mb-2">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileTap={{ scale: 0.98 }}
          className={clsx(
            "flex w-full items-center justify-between px-3 py-3 rounded-2xl",
            "text-sm font-medium tracking-tight transition-all duration-300",
            "bg-gradient-to-r from-blue-50/50 to-purple-50/50 hover:from-blue-100/50 hover:to-purple-100/50",
            "dark:from-slate-800/50 dark:to-slate-700/50 dark:hover:from-slate-700/70 dark:hover:to-slate-600/70",
            "border border-blue-200/30 dark:border-slate-600/30 hover:border-blue-300/50 dark:hover:border-slate-500/50",
            isDarkTheme ? "text-white" : "text-gray-900"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <UserAvatar size={32} />
              {/* Online indicator */}
              <div className="absolute bottom-5 -right-3 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></div>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </motion.button>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-blue-200/30 dark:border-slate-700/30 shadow-xl overflow-hidden"
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-3 border-b border-blue-200/30 dark:border-slate-700/30">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 text-center">
                  User Menu
                </span>
                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2 space-y-1">
              <motion.button
                onClick={() => handleNavigation("/account")}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 cursor-pointer transition-all duration-300 group"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex items-center justify-center group-hover:from-blue-500/20 group-hover:to-purple-500/20">
                  <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">Tài khoản của tôi</div>
                  <div className="text-xs text-muted-foreground">
                    Quản lý thông tin
                  </div>
                </div>
              </motion.button>

              <motion.button
                onClick={() => handleNavigation("/stories")}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 cursor-pointer transition-all duration-300 group"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 flex items-center justify-center group-hover:from-green-500/20 group-hover:to-emerald-500/20">
                  <BookOpen className="w-3 h-3 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">Truyện của tôi</div>
                  <div className="text-xs text-muted-foreground">
                    Quản lý tác phẩm
                  </div>
                </div>
              </motion.button>

              <motion.button
                onClick={() => handleNavigation("/settings")}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-xl hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 dark:hover:from-orange-900/20 dark:hover:to-yellow-900/20 cursor-pointer transition-all duration-300 group"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-orange-500/10 to-yellow-500/10 flex items-center justify-center group-hover:from-orange-500/20 group-hover:to-yellow-500/20">
                  <Settings className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">Cài đặt</div>
                  <div className="text-xs text-muted-foreground">Tùy chỉnh</div>
                </div>
              </motion.button>

              {/* Divider */}
              <div className="my-2 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700" />

              {/* Logout */}
              <motion.button
                onClick={handleSignOut}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 cursor-pointer transition-all duration-300 group"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-red-500/10 to-pink-500/10 flex items-center justify-center group-hover:from-red-500/20 group-hover:to-pink-500/20">
                  <LogOut className="w-3 h-3 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-red-600 dark:text-red-400">
                    Đăng xuất
                  </div>
                  <div className="text-xs text-red-500/70 dark:text-red-400/70">
                    Hẹn gặp lại!
                  </div>
                </div>
              </motion.button>
            </div>

            {/* Footer */}
            <div className="p-2 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-slate-800/50 dark:to-slate-700/50 border-t border-blue-200/30 dark:border-slate-700/30">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Heart className="w-2.5 h-2.5 text-red-500" />
                <span>Happy storytelling!</span>
                <Sparkles className="w-2.5 h-2.5 text-yellow-500" />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-2xl cursor-pointer transition-all duration-300",
            "bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100",
            "dark:from-slate-800/50 dark:to-slate-700/50 dark:hover:from-slate-700/70 dark:hover:to-slate-600/70",
            "border border-blue-200/50 dark:border-slate-600/50 hover:border-blue-300/70 dark:hover:border-slate-500/70",
            "shadow-sm hover:shadow-md",
            isDarkTheme ? "text-white" : "text-gray-900"
          )}
        >
          <div className="relative">
            <UserAvatar />
            {/* Online indicator */}
            <div className="absolute bottom-5 -right-2 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></div>
          </div>

          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 p-0 border-0 shadow-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl overflow-hidden"
      >
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-3 border-b border-blue-200/30 dark:border-slate-700/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 text-center">
              User Profile
            </span>
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <UserAvatar size={40} />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-slate-900"></div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-3 space-y-1">
          <motion.div
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <DropdownMenuItem
              onClick={() => {
                startLoading("/account");
                router.push("/account");
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 cursor-pointer transition-all duration-300 group"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex items-center justify-center group-hover:from-blue-500/20 group-hover:to-purple-500/20">
                <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Tài khoản của tôi</div>
                <div className="text-xs text-muted-foreground">
                  Quản lý thông tin
                </div>
              </div>
            </DropdownMenuItem>
          </motion.div>

          <motion.div
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <DropdownMenuItem
              onClick={() => {
                startLoading("/stories");
                router.push("/stories");
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 cursor-pointer transition-all duration-300 group"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 flex items-center justify-center group-hover:from-green-500/20 group-hover:to-emerald-500/20">
                <BookOpen className="w-3 h-3 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Truyện của tôi</div>
                <div className="text-xs text-muted-foreground">
                  Quản lý tác phẩm
                </div>
              </div>
            </DropdownMenuItem>
          </motion.div>

          <motion.div
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <DropdownMenuItem
              onClick={() => {
                startLoading("/settings");
                router.push("/settings");
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 dark:hover:from-orange-900/20 dark:hover:to-yellow-900/20 cursor-pointer transition-all duration-300 group"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-orange-500/10 to-yellow-500/10 flex items-center justify-center group-hover:from-orange-500/20 group-hover:to-yellow-500/20">
                <Settings className="w-3 h-3 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">Cài đặt</div>
                <div className="text-xs text-muted-foreground">Tùy chỉnh</div>
              </div>
            </DropdownMenuItem>
          </motion.div>

          {/* Divider */}
          <div className="my-3 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700" />

          {/* Logout */}
          <motion.div
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <DropdownMenuItem
              onClick={() => {
                startLoading("/");
                signOut({ callbackUrl: "/" });
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 cursor-pointer transition-all duration-300 group"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-red-500/10 to-pink-500/10 flex items-center justify-center group-hover:from-red-500/20 group-hover:to-pink-500/20">
                <LogOut className="w-3 h-3 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-red-600 dark:text-red-400">
                  Đăng xuất
                </div>
                <div className="text-xs text-red-500/70 dark:text-red-400/70">
                  Hẹn gặp lại!
                </div>
              </div>
            </DropdownMenuItem>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-slate-800/50 dark:to-slate-700/50 border-t border-blue-200/30 dark:border-slate-700/30">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Heart className="w-3 h-3 text-red-500" />
            <span>Happy storytelling!</span>
            <Sparkles className="w-3 h-3 text-yellow-500" />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
