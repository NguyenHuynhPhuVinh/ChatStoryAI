"use client";

import * as React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import clsx from "clsx";
import { Sun, Moon, Sparkles } from "lucide-react";
import { Navigation } from "./pc-navigation";
import { MobileMenu } from "./mobile-menu";
import { NavItem } from "./types";

interface NavButton {
  className?: string;
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
  onClick?: () => void;
  asChild?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
}

const NavButton: React.FC<NavButton> = ({
  className,
  children,
  variant = "default",
  onClick,
}) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={clsx(
        "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "h-10 px-4 py-2 relative overflow-hidden",
        variant === "default" && [
          "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl",
          "dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600",
        ],
        variant === "outline" && [
          "border border-white/20 dark:border-slate-700/50 backdrop-blur-sm",
          "hover:bg-blue-50 dark:hover:bg-slate-800/50 hover:border-blue-200 dark:hover:border-blue-700",
        ],
        variant === "ghost" && [
          "hover:bg-blue-50 dark:hover:bg-slate-800/50 rounded-xl",
          "hover:text-blue-600 dark:hover:text-blue-400",
        ],
        className
      )}
    >
      {children}
    </motion.button>
  );
};

interface HeaderProps {
  className?: string;
  theme?: "light" | "dark";
  isSticky?: boolean;
  isStickyOverlay?: boolean;
  withBorder?: boolean;
  logo?: React.ReactNode;
  menuItems?: NavItem[];
  onThemeChange?: () => void;
  rightContent?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  className,
  theme = "light",
  isSticky = false,
  isStickyOverlay = false,
  withBorder = false,
  logo,
  menuItems = [],
  onThemeChange,
  rightContent,
}) => {
  const isDarkTheme = theme === "dark";
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = scrollY.onChange((latest) => {
      setIsScrolled(latest > 50);
    });
    return () => unsubscribe();
  }, [scrollY]);

  const headerVariants = {
    top: {
      backgroundColor: isDarkTheme
        ? "rgba(15, 23, 42, 0)"
        : "rgba(255, 255, 255, 0)",
      backdropFilter: "blur(0px)",
      borderColor: "rgba(255, 255, 255, 0)",
      boxShadow: "0 0 0 0 rgba(0, 0, 0, 0)",
    },
    scrolled: {
      backgroundColor: isDarkTheme
        ? "rgba(15, 23, 42, 0.95)"
        : "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(20px)",
      borderColor: isDarkTheme
        ? "rgba(148, 163, 184, 0.2)"
        : "rgba(0, 0, 0, 0.1)",
      boxShadow: "0 4px 20px 0 rgba(0, 0, 0, 0.1)",
    },
  };

  return (
    <motion.header
      variants={headerVariants}
      animate={isScrolled ? "scrolled" : "top"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={clsx(
        "relative z-40 w-full transition-all duration-300",
        isSticky && "sticky top-0",
        "border-b",
        className
      )}
    >
      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          className="flex h-16 items-center justify-between"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {logo}
          </motion.div>

          <Navigation isDarkTheme={isDarkTheme} items={menuItems} />

          <div className="flex items-center gap-x-3">
            <div className="hidden lg:flex items-center gap-x-3">
              {rightContent}
              {onThemeChange && (
                <motion.div
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <NavButton
                    variant="ghost"
                    size="icon"
                    onClick={onThemeChange}
                  >
                    <motion.div
                      initial={false}
                      animate={{ rotate: isDarkTheme ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {isDarkTheme ? (
                        <Sun className="h-4 w-4" />
                      ) : (
                        <Moon className="h-4 w-4" />
                      )}
                    </motion.div>
                    <span className="sr-only">Toggle theme</span>
                  </NavButton>
                </motion.div>
              )}
            </div>

            <MobileMenu
              items={menuItems}
              isDarkTheme={isDarkTheme}
              onThemeChange={onThemeChange}
              logo={logo}
            />
          </div>
        </motion.div>
      </div>
    </motion.header>
  );
};

export { NavButton };
export default Header;
