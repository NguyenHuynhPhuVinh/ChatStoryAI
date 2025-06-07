"use client"

import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ChatBubbleProps {
  message: string
  isUser?: boolean
  avatar?: string
  name?: string
  timestamp?: string
  delay?: number
  typing?: boolean
  className?: string
}

export function ChatBubble({
  message,
  isUser = false,
  avatar,
  name,
  timestamp,
  delay = 0,
  typing = false,
  className
}: ChatBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay,
        ease: "easeOut"
      }}
      className={cn(
        "flex gap-3 max-w-[80%]",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto",
        className
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <Avatar className="w-8 h-8">
          <AvatarImage src={avatar} />
          <AvatarFallback className={cn(
            "text-xs font-medium",
            isUser 
              ? "bg-blue-500 text-white" 
              : "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
          )}>
            {name ? name.charAt(0).toUpperCase() : (isUser ? "B" : "AI")}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex flex-col gap-1",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Name and timestamp */}
        {(name || timestamp) && (
          <div className={cn(
            "flex items-center gap-2 text-xs text-muted-foreground",
            isUser ? "flex-row-reverse" : ""
          )}>
            {name && <span className="font-medium">{name}</span>}
            {timestamp && <span>{timestamp}</span>}
          </div>
        )}

        {/* Message bubble */}
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2, delay: delay + 0.1 }}
          className={cn(
            "relative px-4 py-3 rounded-2xl max-w-sm",
            "shadow-sm border backdrop-blur-sm",
            isUser
              ? "bg-blue-500 text-white border-blue-400/20"
              : "bg-white/80 dark:bg-slate-800/80 text-foreground border-border/50"
          )}
        >
          {typing ? (
            <TypingIndicator />
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message}
            </p>
          )}

          {/* Message tail */}
          <div
            className={cn(
              "absolute top-3 w-3 h-3 rotate-45",
              isUser
                ? "right-[-6px] bg-blue-500 border-r border-b border-blue-400/20"
                : "left-[-6px] bg-white/80 dark:bg-slate-800/80 border-l border-t border-border/50"
            )}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}

// Typing indicator component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-muted-foreground/60 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground ml-2">đang gõ...</span>
    </div>
  )
}

export { TypingIndicator }
