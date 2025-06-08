import {
  MessageCircle,
  Lock,
  Sparkles,
  Wand2,
  Brain,
  BookOpen,
  Bot,
  Zap,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useLoading } from "@/providers/loading-provider";
import { motion } from "framer-motion";

export function WelcomeScreen() {
  const { data: session } = useSession();
  const isSupporter = session?.user?.hasBadge;
  const router = useRouter();
  const { startLoading } = useLoading();

  return (
    <div className="h-full flex flex-col items-center justify-center px-4 py-8 sm:py-12 text-center relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative mb-6 sm:mb-8"
      >
        <motion.div
          animate={{
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl">
            <Bot className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
          </div>
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400" />
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 sm:mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
      >
        🤖 Trợ Lý Sáng Tạo Truyện AI
      </motion.h1>

      {isSupporter ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-6 sm:space-y-8 max-w-4xl"
        >
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            🎭 Trợ lý AI thông minh giúp bạn phát triển ý tưởng và sáng tạo nội
            dung truyện một cách chuyên nghiệp.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-6 rounded-3xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-xl text-center group"
            >
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Brain className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="font-bold text-lg mb-2 text-blue-600 dark:text-blue-400">
                💡 Tạo Ý Tưởng
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Phát triển ý tưởng độc đáo và sáng tạo cho truyện của bạn
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-6 rounded-3xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-xl text-center group"
            >
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="font-bold text-lg mb-2 text-purple-600 dark:text-purple-400">
                👥 Phát Triển Nhân Vật
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Tạo nhân vật sống động với tính cách đa chiều
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-6 rounded-3xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-xl text-center group"
            >
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="font-bold text-lg mb-2 text-indigo-600 dark:text-indigo-400">
                📚 Quản Lý Chương
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Tạo và chỉnh sửa nội dung chương một cách thông minh
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 rounded-3xl p-6 border border-blue-200/50 dark:border-blue-800/50"
          >
            <p className="text-center text-slate-700 dark:text-slate-300 font-medium">
              ✨ Bắt đầu cuộc trò chuyện với AI để khám phá sức mạnh sáng tạo
              không giới hạn!
            </p>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-6 sm:space-y-8 max-w-3xl"
        >
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6 sm:p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex items-center justify-center mb-6"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl">
                <Lock className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              🔐 Tính năng cho người ủng hộ
            </h2>

            <div className="grid gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200/50 dark:border-blue-800/50"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-700 dark:text-blue-300">
                    💬 Tạo truyện với AI thông minh
                  </h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Trò chuyện trực tiếp với AI để sáng tạo nội dung
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-800/50"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-700 dark:text-purple-300">
                    ✨ Truy cập sớm tính năng mới
                  </h3>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    Được trải nghiệm các tính năng mới nhất trước
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-200/50 dark:border-indigo-800/50"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-indigo-700 dark:text-indigo-300">
                    🧠 Công cụ AI hỗ trợ sáng tạo
                  </h3>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400">
                    Bộ công cụ AI mạnh mẽ cho việc sáng tạo truyện
                  </p>
                </div>
              </motion.div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="default"
                size="lg"
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
                onClick={() => {
                  startLoading("/products");
                  router.push("/products");
                }}
              >
                <Lock className="w-5 h-5 mr-3" />
                🚀 Trở thành người ủng hộ
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
