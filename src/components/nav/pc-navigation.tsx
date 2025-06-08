import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { NavItem } from "./types";
import { useRouter } from "next/navigation";
import { useLoading } from "@/providers/loading-provider";
import { MessageCircle, Sparkles } from "lucide-react";

const ChevronIcon = () => (
  <motion.svg
    width="10"
    height="6"
    viewBox="0 0 10 6"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-2.5 opacity-60 [&_path]:stroke-2"
    whileHover={{ rotate: 180 }}
    transition={{ duration: 0.2 }}
  >
    <path
      d="M1 1L5 5L9 1"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </motion.svg>
);

export const Navigation: React.FC<{
  isDarkTheme?: boolean;
  items: NavItem[];
}> = ({ isDarkTheme, items }) => {
  const router = useRouter();
  const { startLoading } = useLoading();
  const [hoveredItem, setHoveredItem] = React.useState<number | null>(null);

  const handleNavigation = (to?: string) => {
    if (to) {
      startLoading(to);
      router.push(to);
    }
  };

  return (
    <nav>
      <ul className="flex gap-x-0.5 xl:gap-x-1 hidden lg:flex">
        {items.map(({ to, text, items, chatMessage, icon }, index) => {
          return (
            <motion.li
              className={clsx(
                "relative [perspective:2000px]",
                items && items.length > 0 && "group"
              )}
              key={index}
              onHoverStart={() => setHoveredItem(index)}
              onHoverEnd={() => setHoveredItem(null)}
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              {/* Chat Message Tooltip */}
              <AnimatePresence>
                {hoveredItem === index && chatMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.8 }}
                    animate={{ opacity: 1, y: -15, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50"
                  >
                    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl px-4 py-2 shadow-xl border border-white/20 dark:border-slate-700/50 max-w-xs">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {chatMessage}
                        </span>
                      </div>
                      {/* Chat bubble tail */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/95 dark:border-t-slate-800/95"></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                onClick={() => handleNavigation(to)}
                className={clsx(
                  "flex items-center gap-x-1.5 px-3 py-2 rounded-xl w-full relative overflow-hidden",
                  "text-sm font-medium tracking-tight",
                  "transition-all duration-300",
                  "border border-transparent hover:border-blue-200/50 dark:hover:border-blue-700/50",
                  isDarkTheme ? "text-white" : "text-gray-700"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Chat Bubble Background Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                />

                {/* Floating Sparkles */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                >
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        left: `${20 + i * 30}%`,
                        top: `${20 + i * 20}%`,
                      }}
                      animate={{
                        y: [0, -10, 0],
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                    >
                      <Sparkles className="w-3 h-3 text-blue-400" />
                    </motion.div>
                  ))}
                </motion.div>

                <span className="relative z-10 text-lg">{icon}</span>
                <span className="relative z-10">
                  {text.replace(/^[^\s]+\s/, "")}
                </span>
                {items && items.length > 0 && (
                  <motion.span
                    className="relative z-10"
                    animate={{ rotate: hoveredItem === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronIcon />
                  </motion.span>
                )}
              </motion.button>
              {items && items.length > 0 && (
                <AnimatePresence>
                  {hoveredItem === index && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.9 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="absolute left-0 top-full w-[380px] pt-4 pointer-events-auto z-50"
                    >
                      <motion.div
                        className={clsx(
                          "relative rounded-2xl p-4 w-full",
                          "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl",
                          "shadow-xl shadow-gray-900/15 dark:shadow-black/30",
                          "border border-white/30 dark:border-slate-700/50"
                        )}
                        layoutId={`dropdown-${index}`}
                      >
                        {/* Chat Window Header */}
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200/50 dark:border-slate-700/50">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex-1 text-center">
                            ChatStory AI
                          </span>
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                        </div>

                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl" />

                        <div className="space-y-2">
                          {items.map(
                            (
                              {
                                icon,
                                text,
                                description,
                                to,
                                chatStyle,
                                featured,
                              },
                              subIndex
                            ) => (
                              <motion.button
                                key={subIndex}
                                onClick={() => handleNavigation(to)}
                                className={clsx(
                                  "flex items-start gap-2 rounded-xl p-3 w-full relative overflow-hidden",
                                  "transition-all duration-300 group",
                                  "hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50",
                                  "dark:hover:from-blue-900/20 dark:hover:to-purple-900/20",
                                  featured &&
                                    "ring-1 ring-blue-200/50 dark:ring-blue-700/50",
                                  isDarkTheme ? "text-white" : "text-gray-700"
                                )}
                                whileHover={{
                                  scale: 1.02,
                                  x: 6,
                                }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: subIndex * 0.1 }}
                              >
                                {/* Chat Bubble Style Background */}
                                <motion.div
                                  className={clsx(
                                    "absolute inset-0 rounded-2xl",
                                    chatStyle &&
                                      "bg-gradient-to-r from-blue-500/5 to-purple-500/5"
                                  )}
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  whileHover={{ scale: 1, opacity: 1 }}
                                  transition={{ duration: 0.2 }}
                                />

                                {/* Message Icon */}
                                <motion.div
                                  className={clsx(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                    "bg-gradient-to-br from-blue-500/10 to-purple-500/10",
                                    "border border-blue-200/50 dark:border-blue-700/50",
                                    "group-hover:from-blue-500/20 group-hover:to-purple-500/20"
                                  )}
                                  whileHover={{ scale: 1.05, rotate: 5 }}
                                >
                                  {icon ? (
                                    <img
                                      className="h-4 w-4"
                                      src={isDarkTheme ? icon.dark : icon.light}
                                      alt=""
                                      loading="lazy"
                                    />
                                  ) : (
                                    <MessageCircle className="h-4 w-4 text-blue-500" />
                                  )}
                                </motion.div>

                                {/* Message Content */}
                                <div className="flex-1 text-left relative">
                                  <div className="text-sm font-medium tracking-tight mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {text}
                                  </div>
                                  {description && (
                                    <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                      {description}
                                    </div>
                                  )}

                                  {/* Featured Badge */}
                                  {featured && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute -top-1 -right-1"
                                    >
                                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                        ✨ HOT
                                      </div>
                                    </motion.div>
                                  )}
                                </div>

                                {/* Hover Arrow */}
                                <motion.div
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  initial={{ x: -10 }}
                                  whileHover={{ x: 0 }}
                                >
                                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <span className="text-blue-500 text-sm">
                                      →
                                    </span>
                                  </div>
                                </motion.div>
                              </motion.button>
                            )
                          )}
                        </div>

                        {/* Typing Indicator */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200/50 dark:border-slate-700/50"
                        >
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-2 h-2 bg-blue-400 rounded-full"
                                animate={{
                                  scale: [1, 1.2, 1],
                                  opacity: [0.5, 1, 0.5],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  delay: i * 0.2,
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            AI đang sẵn sàng giúp bạn...
                          </span>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.li>
          );
        })}
      </ul>
    </nav>
  );
};
