import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { NavItem } from "./types";
import { useRouter } from "next/navigation";
import { useLoading } from "@/providers/loading-provider";

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
      <ul className="flex gap-x-1 xl:gap-x-2 hidden lg:flex">
        {items.map(({ to, text, items }, index) => {
          const Tag = to ? "button" : "button";
          return (
            <motion.li
              className={clsx(
                "relative [perspective:2000px]",
                items && items.length > 0 && "group"
              )}
              key={index}
              onHoverStart={() => setHoveredItem(index)}
              onHoverEnd={() => setHoveredItem(null)}
              whileHover={{ y: -1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <motion.button
                onClick={() => handleNavigation(to)}
                className={clsx(
                  "flex items-center gap-x-1.5 px-4 py-2 rounded-xl w-full relative overflow-hidden",
                  "text-base font-semibold tracking-tight",
                  "transition-all duration-300",
                  isDarkTheme ? "text-white" : "text-gray-700"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Hover Background Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                />

                <span className="relative z-10">{text}</span>
                {items && items.length > 0 && (
                  <span className="relative z-10">
                    <ChevronIcon />
                  </span>
                )}
              </motion.button>
              {items && items.length > 0 && (
                <AnimatePresence>
                  {hoveredItem === index && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute left-0 top-full w-[320px] pt-3 pointer-events-auto"
                    >
                      <motion.div
                        className={clsx(
                          "relative rounded-2xl p-4 w-full",
                          "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl",
                          "shadow-xl shadow-gray-900/10 dark:shadow-black/30",
                          "border border-white/20 dark:border-slate-700/50"
                        )}
                        layoutId={`dropdown-${index}`}
                      >
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl" />

                        {items.map(
                          ({ icon, text, description, to }, subIndex) => (
                            <motion.button
                              key={subIndex}
                              onClick={() => handleNavigation(to)}
                              className={clsx(
                                "flex items-center gap-3 rounded-xl p-3 w-full relative overflow-hidden",
                                "transition-all duration-300",
                                isDarkTheme ? "text-white" : "text-gray-700"
                              )}
                              whileHover={{
                                x: 4,
                                backgroundColor: isDarkTheme
                                  ? "rgba(51, 65, 85, 0.5)"
                                  : "rgba(59, 130, 246, 0.1)",
                              }}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: subIndex * 0.05 }}
                            >
                              {icon && (
                                <motion.div
                                  className={clsx(
                                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                                    "bg-gradient-to-r from-blue-500/10 to-purple-500/10",
                                    "border border-blue-200/50 dark:border-blue-700/50"
                                  )}
                                  whileHover={{ scale: 1.1, rotate: 5 }}
                                >
                                  <img
                                    className="h-5 w-5"
                                    src={isDarkTheme ? icon.dark : icon.light}
                                    alt=""
                                    loading="lazy"
                                  />
                                </motion.div>
                              )}
                              <div className="flex-1 text-left">
                                <div className="font-semibold tracking-tight">
                                  {text}
                                </div>
                                {description && (
                                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {description}
                                  </div>
                                )}
                              </div>
                            </motion.button>
                          )
                        )}
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
