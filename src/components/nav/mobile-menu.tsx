/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import clsx from "clsx";
import { Sun, Moon, ChevronRight, MessageCircle, Sparkles } from "lucide-react";
import { NavItem } from "./types";
import { useSession } from "next-auth/react";
import { Login } from "../login/login";
import { UserMenu } from "./user-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useRouter } from "next/navigation";
import { useLoading } from "@/providers/loading-provider";
import { NotificationBell } from "@/components/notification-bell";

interface MobileMenuProps {
  items?: NavItem[];
  isDarkTheme?: boolean;
  onThemeChange?: () => void;
  logo?: React.ReactNode;
}

const MobileMenuItem: React.FC<{
  item: NavItem;
  isDarkTheme?: boolean;
  onClose?: () => void;
}> = ({ item, isDarkTheme, onClose }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(
    item.items && item.items.length > 0
  );
  const { startLoading } = useLoading();

  const handleNavigation = (to?: string) => {
    if (to) {
      startLoading(to);
      router.push(to);
      onClose?.();
    }
  };

  if (item.to) {
    return (
      <div className="px-2 mb-2">
        <button
          onClick={() => handleNavigation(item.to)}
          className={clsx(
            "flex items-center w-full px-3 py-3 rounded-2xl",
            "text-sm font-semibold tracking-tight",
            "hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50",
            "dark:hover:from-blue-900/20 dark:hover:to-purple-900/20",
            "active:bg-blue-100 dark:active:bg-slate-700/50",
            "transition-all duration-300 group",
            "border border-transparent hover:border-blue-200/50 dark:hover:border-blue-700/50",
            isDarkTheme ? "text-white" : "text-gray-900"
          )}
        >
          <span className="text-base mr-2 shrink-0">{item.icon}</span>
          <span className="flex-1 text-left truncate">
            {item.text?.replace(/^[^\s]+\s/, "")}
          </span>
          <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <ChevronRight className="h-3 w-3 text-blue-500" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full px-2 mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "flex w-full items-center justify-between px-3 py-3 rounded-2xl",
          "text-sm font-semibold tracking-tight group",
          "hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50",
          "dark:hover:from-blue-900/20 dark:hover:to-purple-900/20",
          "hover:text-blue-600 dark:hover:text-blue-400",
          "active:bg-blue-100 dark:active:bg-slate-700/50",
          "transition-all duration-300",
          "border border-transparent hover:border-blue-200/50 dark:hover:border-blue-700/50",
          isDarkTheme ? "text-white" : "text-gray-700"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-base shrink-0">{item.icon}</span>
          <span className="text-left truncate">
            {item.text?.replace(/^[^\s]+\s/, "")}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {item.chatMessage && (
            <MessageCircle className="w-3 h-3 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          <ChevronRight
            className={clsx(
              "h-4 w-4 transition-all duration-300",
              !isOpen && "text-gray-400 group-hover:text-blue-500",
              isOpen && "rotate-90 text-blue-500"
            )}
          />
        </div>
      </button>
      {isOpen && (
        <div className="w-full bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-slate-800/30 dark:to-slate-700/30 rounded-2xl mt-2 mx-2 p-2 backdrop-blur-sm border border-blue-200/30 dark:border-slate-700/30 overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center gap-2 px-2 py-1 mb-2 border-b border-blue-200/30 dark:border-slate-700/30">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 text-center">
              ChatStory AI
            </span>
            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
          </div>

          <div className="space-y-1 overflow-hidden">
            {item.items?.map((subItem, index) => (
              <button
                key={index}
                onClick={() => handleNavigation(subItem.to)}
                className={clsx(
                  "flex items-start gap-2 w-full px-2 py-2 rounded-xl",
                  "hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50",
                  "dark:hover:from-blue-900/20 dark:hover:to-purple-900/20",
                  "hover:text-blue-600 dark:hover:text-blue-400",
                  "active:bg-blue-100 dark:active:bg-slate-700/50",
                  "transition-all duration-300 group",
                  subItem.featured &&
                    "ring-1 ring-blue-200/50 dark:ring-blue-700/50",
                  isDarkTheme ? "text-white" : "text-gray-700"
                )}
              >
                {/* Message Icon */}
                <div
                  className={clsx(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg mt-0.5",
                    "bg-gradient-to-br from-blue-500/10 to-purple-500/10",
                    "border border-blue-200/50 dark:border-blue-700/50",
                    "group-hover:from-blue-500/20 group-hover:to-purple-500/20"
                  )}
                >
                  <MessageCircle className="h-3 w-3 text-blue-500" />
                </div>

                <div className="flex-1 text-left min-w-0">
                  <div className="text-xs font-semibold tracking-tight mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                    {subItem.text}
                  </div>
                  {subItem.description && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 leading-tight line-clamp-2">
                      {subItem.description}
                    </div>
                  )}

                  {/* Featured Badge */}
                  {subItem.featured && (
                    <div className="inline-flex items-center gap-1 mt-1">
                      <Sparkles className="w-2 h-2 text-yellow-500" />
                      <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                        HOT
                      </span>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="w-4 h-4 rounded-full bg-blue-500/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0">
                  <ChevronRight className="h-2 w-2 text-blue-500" />
                </div>
              </button>
            ))}
          </div>

          {/* Typing Indicator */}
          <div className="flex items-center gap-2 px-3 py-2 mt-2 border-t border-blue-200/30 dark:border-slate-700/30">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              AI sẵn sàng hỗ trợ...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export const MobileMenu: React.FC<MobileMenuProps> = ({
  items = [],
  isDarkTheme,
  onThemeChange,
  logo,
}) => {
  const { data: session } = useSession();
  const [open, setOpen] = React.useState(false);

  const handleCloseMenu = () => {
    setOpen(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            className={clsx(
              "lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md",
              isDarkTheme ? "text-white" : "text-gray-900"
            )}
          >
            <span className="sr-only">Open menu</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className={clsx(
            "w-full max-w-sm p-0 flex flex-col overflow-hidden",
            "bg-gradient-to-br from-blue-50/30 to-purple-50/30",
            "dark:from-slate-900 dark:to-slate-800",
            isDarkTheme ? "bg-slate-900" : "bg-white"
          )}
        >
          <SheetHeader className="p-4 border-b border-blue-200/30 dark:border-slate-700/50 bg-gradient-to-r from-blue-500/5 to-purple-500/5 shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 text-center">
                ChatStory AI
              </span>
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <SheetTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
              {logo}
            </SheetTitle>
            {/* Compact chat welcome message */}
            <div className="mt-2 p-2 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-blue-200/30 dark:border-slate-700/30">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-3 h-3 text-blue-500 shrink-0" />
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">
                  Sẵn sàng tạo câu chuyện! ✨
                </p>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {session && (
              <div className="flex items-center justify-end gap-2 p-4 border-b border-blue-200/30 dark:border-slate-700/50">
                <NotificationBell />
              </div>
            )}

            <div className="py-2">
              {items.map((item: NavItem, index: number) => (
                <MobileMenuItem
                  key={index}
                  item={item}
                  isDarkTheme={isDarkTheme}
                  onClose={handleCloseMenu}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 p-6 space-y-4">
            {session ? (
              <UserMenu
                isDarkTheme={isDarkTheme}
                isMobile={true}
                onMobileMenuClose={handleCloseMenu}
              />
            ) : (
              <Login />
            )}
            {onThemeChange && (
              <button
                className={clsx(
                  "flex w-full items-center justify-between px-4 py-3 rounded-lg",
                  "text-base font-semibold tracking-tight",
                  "hover:bg-gray-100 dark:hover:bg-[#1C1D21]",
                  isDarkTheme ? "text-white" : "text-gray-900"
                )}
                onClick={onThemeChange}
              >
                <span>{isDarkTheme ? "Chế độ sáng" : "Chế độ tối"}</span>
                <div className="relative w-5 h-5">
                  <Sun
                    className={clsx(
                      "h-5 w-5 absolute transition-transform duration-100",
                      isDarkTheme
                        ? "opacity-100 rotate-0"
                        : "opacity-0 rotate-90"
                    )}
                  />
                  <Moon
                    className={clsx(
                      "h-5 w-5 absolute transition-transform duration-100",
                      isDarkTheme
                        ? "opacity-0 -rotate-90"
                        : "opacity-100 rotate-0"
                    )}
                  />
                </div>
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
