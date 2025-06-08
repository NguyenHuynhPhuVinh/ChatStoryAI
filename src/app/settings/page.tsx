/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AuthClient } from "@/services/auth.client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  User,
  Camera,
  Shield,
  Trash2,
  Settings as SettingsIcon,
  MessageCircle,
  Sparkles,
  Lock,
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [avatar, setAvatar] = useState<string>("/default-user.webp");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (session?.user?.avatar) {
      setAvatar(session.user.avatar);
    }
  }, [session?.user?.avatar]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra kích thước file (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File không được vượt quá 2MB");
      return;
    }

    // Kiểm tra định dạng file
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc GIF");
      return;
    }

    try {
      setIsLoading(true);
      const result = await AuthClient.updateAvatar(file);

      // Cập nhật cả session và state local
      const newAvatar = result.user.avatar;
      await update({ avatar: newAvatar });
      setAvatar(newAvatar);

      toast.success("Cập nhật ảnh đại diện thành công!");
    } catch (error: any) {
      toast.error(error.message || "Đã có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newUsername = formData.get("name") as string;

    if (!newUsername) {
      toast.error("Tên không được để trống");
      return;
    }

    try {
      setIsLoading(true);
      const result = await AuthClient.updateUsername(newUsername);

      // Chỉ cập nhật name trong session
      await update({ name: newUsername });

      toast.success("Cập nhật tên thành công!");
    } catch (error: any) {
      toast.error(error.message || "Đã có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("current-password") as string;
    const newPassword = formData.get("new-password") as string;
    const confirmPassword = formData.get("confirm-password") as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }

    try {
      setIsLoading(true);
      await AuthClient.updatePassword(currentPassword, newPassword);
      (e.target as HTMLFormElement).reset();
      toast.success("Cập nhật mật khẩu thành công!");
    } catch (error: any) {
      toast.error(error.message || "Đã có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Vui lòng nhập mật khẩu để xác nhận");
      return;
    }

    try {
      setIsLoading(true);
      await AuthClient.deleteAccount(deletePassword);
      toast.success("Xóa tài khoản thành công!");
      setShowDeleteDialog(false);
      signOut({ callbackUrl: "/" });
    } catch (error: any) {
      toast.error(error.message || "Đã có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 container mx-auto max-w-6xl px-4 py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Cài Đặt
                </span>
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Tùy chỉnh trải nghiệm chat story của bạn
              </p>
            </div>
          </div>
        </motion.div>

        {/* Chat-style Settings Cards */}
        <div className="space-y-8">
          {/* Avatar Settings - Chat Bubble Style */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Ảnh Đại Diện
                  </h3>
                </div>
                <p className="text-muted-foreground mb-6">
                  Cập nhật ảnh đại diện để cá nhân hóa trải nghiệm chat story
                  của bạn
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <Image
                      src={avatar}
                      alt="Avatar"
                      fill
                      sizes="96px"
                      className="rounded-full object-cover ring-4 ring-blue-100 dark:ring-blue-900/50"
                      priority
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <Camera className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="w-full">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      disabled={isLoading}
                      className="border-2 border-dashed border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Cho phép PNG, JPG hoặc GIF. Tối đa 2MB.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Profile Settings - Chat Bubble Style */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-start gap-4 justify-end"
          >
            <div className="flex-1">
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Thông Tin Cá Nhân
                  </h3>
                </div>
                <p className="text-muted-foreground mb-6">
                  Cập nhật thông tin để tạo trải nghiệm chat story phù hợp với
                  bạn
                </p>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Tên hiển thị
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={session?.user?.name || ""}
                      placeholder="Nhập tên của bạn"
                      className="border-purple-200 dark:border-purple-800 focus:border-purple-400 dark:focus:border-purple-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      defaultValue={session?.user?.email || ""}
                      disabled
                      className="bg-gray-50 dark:bg-gray-800"
                    />
                    <p className="text-sm text-muted-foreground">
                      Email không thể thay đổi.
                    </p>
                  </div>
                  <div className="mt-6">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </motion.div>

          {/* Security Settings - Chat Bubble Style */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-start gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-500/10 to-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-5 h-5 text-green-600" />
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Bảo Mật
                  </h3>
                </div>
                <p className="text-muted-foreground mb-6">
                  Cập nhật mật khẩu để bảo vệ tài khoản và câu chuyện của bạn
                </p>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="current-password"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      Mật khẩu hiện tại
                    </Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        name="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu hiện tại"
                        className="border-green-200 dark:border-green-800 focus:border-green-400 dark:focus:border-green-600 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="new-password"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      Mật khẩu mới
                    </Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        name="new-password"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu mới"
                        className="border-green-200 dark:border-green-800 focus:border-green-400 dark:focus:border-green-600 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="confirm-password"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      Xác nhận mật khẩu mới
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        name="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Xác nhận mật khẩu mới"
                        className="border-green-200 dark:border-green-800 focus:border-green-400 dark:focus:border-green-600 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isLoading ? "Đang cập nhật..." : "Đổi mật khẩu"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>

          {/* Delete Account - Chat Bubble Style */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-start gap-4 justify-end"
          >
            <div className="flex-1">
              <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-xl rounded-3xl shadow-xl border border-red-200/50 dark:border-red-800/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <h3 className="text-xl font-semibold text-red-600 dark:text-red-400">
                    Xóa Tài Khoản
                  </h3>
                </div>
                <p className="text-red-700 dark:text-red-300 mb-6">
                  Xóa vĩnh viễn tài khoản và tất cả câu chuyện của bạn. Hành
                  động này không thể hoàn tác.
                </p>

                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isLoading ? "Đang xử lý..." : "Xóa tài khoản"}
                </Button>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-red-500/10 to-red-600/10 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </motion.div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-red-200 dark:border-red-800">
            <DialogHeader>
              <DialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Bạn chắc chắn muốn xóa tài khoản?
              </DialogTitle>
              <DialogDescription className="text-red-700 dark:text-red-300">
                Hành động này không thể hoàn tác. Tài khoản và tất cả câu chuyện
                của bạn sẽ bị xóa vĩnh viễn.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label
                  htmlFor="delete-password"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Nhập mật khẩu để xác nhận
                </Label>
                <Input
                  id="delete-password"
                  type="password"
                  placeholder="Nhập mật khẩu của bạn"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="border-red-200 dark:border-red-800 focus:border-red-400 dark:focus:border-red-600"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletePassword("");
                }}
                className="border-gray-300 hover:bg-gray-50"
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
              >
                {isLoading ? "Đang xử lý..." : "Xác nhận xóa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
