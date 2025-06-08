/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StoryCard } from "@/components/story-card";
import {
  BookOpenText,
  Search,
  MessageCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { searchStoriesWithAI } from "@/lib/gemini";
import { motion } from "framer-motion";

interface Story {
  story_id: number;
  title: string;
  description: string;
  cover_image: string | null;
  main_category: string;
  tags: string[];
  view_count: number;
  favorite_count: number;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
}

interface Tag {
  id: number;
  name: string;
  description: string;
}

function SearchContent() {
  const searchParams = useSearchParams();

  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category") || null
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get("tags")
      ? decodeURIComponent(searchParams.get("tags")!).split(",").filter(Boolean)
      : []
  );
  const [timeRange, setTimeRange] = useState<string>(
    searchParams.get("timeRange") || "all"
  );
  const [fromDate, setFromDate] = useState<Date | undefined>(
    searchParams.get("fromDate")
      ? new Date(searchParams.get("fromDate")!)
      : undefined
  );
  const [toDate, setToDate] = useState<Date | undefined>(
    searchParams.get("toDate")
      ? new Date(searchParams.get("toDate")!)
      : undefined
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "updated");
  const [sortOrder, setSortOrder] = useState(
    searchParams.get("sortOrder") || "desc"
  );
  const [minViews, setMinViews] = useState(searchParams.get("minViews") || "");
  const [minFavorites, setMinFavorites] = useState(
    searchParams.get("minFavorites") || ""
  );
  const [useAI, setUseAI] = useState(searchParams.get("useAI") === "true");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        if (response.ok) {
          setMainCategories(data.mainCategories);
          setTags(data.tags);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách thể loại:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (searchParams.get("category") || searchParams.get("tags")) {
      handleSearch();
    }
  }, []);

  const updateURL = (params: URLSearchParams) => {
    const url = new URL(window.location.href);
    url.search = params.toString();
    window.history.pushState({}, "", url);
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));

      if (timeRange !== "all") params.set("timeRange", timeRange);
      if (fromDate)
        params.set("fromDate", fromDate.toISOString().split("T")[0]);
      if (toDate) params.set("toDate", toDate.toISOString().split("T")[0]);
      if (sortBy !== "updated") params.set("sortBy", sortBy);
      if (sortOrder !== "desc") params.set("sortOrder", sortOrder);
      if (minViews) params.set("minViews", minViews);
      if (minFavorites) params.set("minFavorites", minFavorites);
      if (useAI) params.set("useAI", "true");

      updateURL(params);

      const response = await fetch(`/api/library/search?${params.toString()}`);
      const data = await response.json();

      if (useAI && searchQuery) {
        const storiesForAI = data.stories.map((story: any) => ({
          story_id: story.story_id,
          title: story.title,
          description: story.description,
          main_category: story.main_category,
          tags:
            typeof story.tags === "string"
              ? story.tags.split(",").filter(Boolean)
              : Array.isArray(story.tags)
              ? story.tags
              : [],
        }));

        const aiResults = await searchStoriesWithAI(searchQuery, storiesForAI);

        const storiesWithAI = data.stories
          .map((story: any) => {
            const aiResult = aiResults.find(
              (r) => r.story_id === story.story_id
            );
            return {
              ...story,
              relevance_score: aiResult?.relevance_score || 0,
              match_reason: aiResult?.reason || "",
              tags:
                typeof story.tags === "string"
                  ? story.tags.split(",").filter(Boolean)
                  : Array.isArray(story.tags)
                  ? story.tags
                  : [],
            };
          })
          .sort((a: any, b: any) => b.relevance_score - a.relevance_score);

        setStories(storiesWithAI);
      } else {
        setStories(
          data.stories.map((story: any) => ({
            ...story,
            tags:
              typeof story.tags === "string"
                ? story.tags.split(",").filter(Boolean)
                : Array.isArray(story.tags)
                ? story.tags
                : [],
          }))
        );
      }
    } catch (error) {
      console.error("Lỗi khi tìm kiếm:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  };

  // Floating elements for background animation
  const floatingElements = [
    {
      icon: MessageCircle,
      delay: 0,
      position: "top-20 left-10",
      color: "text-blue-400",
    },
    {
      icon: Sparkles,
      delay: 1,
      position: "top-32 right-20",
      color: "text-purple-400",
    },
    {
      icon: Zap,
      delay: 2,
      position: "bottom-40 left-20",
      color: "text-yellow-400",
    },
    {
      icon: BookOpenText,
      delay: 3,
      position: "bottom-20 right-10",
      color: "text-green-400",
    },
  ];

  const morphingShapes = [
    { id: 1, x: "10%", y: "20%", size: 60, color: "bg-blue-400/10" },
    { id: 2, x: "80%", y: "30%", size: 80, color: "bg-purple-400/10" },
    { id: 3, x: "20%", y: "70%", size: 100, color: "bg-pink-400/10" },
    { id: 4, x: "70%", y: "80%", size: 70, color: "bg-green-400/10" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20" />

      {/* Morphing Shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {morphingShapes.map((shape) => (
          <motion.div
            key={shape.id}
            className={`absolute ${shape.color} rounded-full blur-xl`}
            style={{
              left: shape.x,
              top: shape.y,
              width: shape.size,
              height: shape.size,
            }}
            animate={{
              scale: [1, 1.5, 0.8, 1.2, 1],
              rotate: [0, 180, 360],
              x: [0, 50, -30, 20, 0],
              y: [0, -30, 40, -20, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Interactive Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingElements.map((element, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0, rotate: 0 }}
            animate={{
              opacity: [0, 0.6, 0.3, 0.7, 0.2],
              scale: [0, 1.2, 0.7, 1, 0.8],
              rotate: [0, 360, 180, 270, 360],
              x: [0, 30, -20, 15, 0],
              y: [0, -40, 20, -15, 0],
            }}
            transition={{
              duration: 6 + Math.random() * 3,
              delay: element.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`absolute ${element.position} ${element.color}/30 dark:${element.color}/15`}
          >
            <element.icon size={25 + Math.random() * 15} />
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Tìm Kiếm
            </span>
            <br />
            <span className="text-foreground">Câu Chuyện</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Khám phá thế giới truyện với công cụ tìm kiếm thông minh
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6 sticky top-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="ml-auto text-sm font-medium text-muted-foreground">
                  Bộ Lọc Tìm Kiếm
                </span>
              </div>

              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="search">
                  <AccordionTrigger>Tìm kiếm</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">Từ khóa</h3>
                        <Input
                          placeholder="Nhập từ khóa tìm kiếm..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium">Thể loại</h3>
                        <div className="flex flex-wrap gap-2">
                          {mainCategories.map((category) => (
                            <Badge
                              key={category.id}
                              variant={
                                selectedCategory === category.name
                                  ? "default"
                                  : "outline"
                              }
                              className="cursor-pointer"
                              onClick={() =>
                                setSelectedCategory(
                                  selectedCategory === category.name
                                    ? null
                                    : category.name
                                )
                              }
                            >
                              {category.name}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Badge
                              key={tag.id}
                              variant={
                                selectedTags.includes(tag.name)
                                  ? "default"
                                  : "outline"
                              }
                              className="cursor-pointer"
                              onClick={() => toggleTag(tag.name)}
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="useAI"
                          checked={useAI}
                          onCheckedChange={setUseAI}
                        />
                        <Label htmlFor="useAI" className="text-sm">
                          Tìm kiếm thông minh với AI
                        </Label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="time">
                  <AccordionTrigger>Thời gian</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">Khoảng thời gian</h3>
                        <Select value={timeRange} onValueChange={setTimeRange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn khoảng thời gian" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="today">Hôm nay</SelectItem>
                            <SelectItem value="week">Tuần này</SelectItem>
                            <SelectItem value="month">Tháng này</SelectItem>
                            <SelectItem value="year">Năm nay</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium">Hoặc chọn khoảng ngày</h3>
                        <div className="flex gap-2">
                          <DatePicker
                            value={fromDate}
                            onChange={setFromDate}
                            placeholder="Từ ngày"
                          />
                          <DatePicker
                            value={toDate}
                            onChange={setToDate}
                            placeholder="Đến ngày"
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="stats">
                  <AccordionTrigger>Thống kê</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">Sắp xếp theo</h3>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn tiêu chí sắp xếp" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="updated">
                              Mới cập nhật
                            </SelectItem>
                            <SelectItem value="views">Lượt xem</SelectItem>
                            <SelectItem value="favorites">
                              Lượt thích
                            </SelectItem>
                            <SelectItem value="views_today">
                              Lượt xem hôm nay
                            </SelectItem>
                            <SelectItem value="favorites_today">
                              Lượt thích hôm nay
                            </SelectItem>
                            <SelectItem value="views_week">
                              Lượt xem tuần này
                            </SelectItem>
                            <SelectItem value="favorites_week">
                              Lượt thích tuần này
                            </SelectItem>
                            <SelectItem value="views_month">
                              Lượt xem tháng này
                            </SelectItem>
                            <SelectItem value="favorites_month">
                              Lượt thích tháng này
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium">Thứ tự</h3>
                        <Select value={sortOrder} onValueChange={setSortOrder}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn thứ tự sắp xếp" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="desc">Giảm dần</SelectItem>
                            <SelectItem value="asc">Tăng dần</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium">Lọc số liệu</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder="Tối thiểu lượt xem"
                            value={minViews}
                            onChange={(e) => setMinViews(e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Tối thiểu lượt thích"
                            value={minFavorites}
                            onChange={(e) => setMinFavorites(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Button
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handleSearch}
              >
                <Search className="w-4 h-4 mr-2" />
                Tìm kiếm
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-3"
          >
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6)
                  .fill(0)
                  .map((_, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex flex-col"
                    >
                      <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden mb-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-slate-700/50">
                        <Skeleton height="100%" />
                      </div>
                      <Skeleton
                        width="70%"
                        height={24}
                        className="mb-2 rounded-full"
                      />
                      <Skeleton
                        width="40%"
                        height={20}
                        className="mb-2 rounded-full"
                      />
                      <Skeleton
                        width="30%"
                        height={16}
                        className="rounded-full"
                      />
                    </motion.div>
                  ))}
              </div>
            ) : stories.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center py-12"
              >
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-12 max-w-md mx-auto">
                  <BookOpenText className="w-16 h-16 mx-auto mb-4 text-blue-400/50" />
                  <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Không tìm thấy truyện nào
                  </h3>
                  <p className="text-muted-foreground">
                    Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {stories.map((story, index) => (
                  <motion.div
                    key={story.story_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <StoryCard story={story} showRelevance={useAI} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
          <div className="container py-8">
            <div className="text-center mb-12">
              <div className="h-12 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 to-purple-800 animate-pulse rounded-full w-64 mx-auto mb-4" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full w-96 mx-auto" />
            </div>
            <div className="grid lg:grid-cols-4 gap-6">
              <div className="space-y-6">
                <div className="h-[400px] animate-pulse bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50" />
              </div>
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array(6)
                    .fill(0)
                    .map((_, index) => (
                      <div key={index} className="flex flex-col">
                        <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden mb-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-slate-700/50">
                          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 to-purple-900/20 animate-pulse" />
                        </div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 animate-pulse mb-2 w-3/4 rounded-full" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 animate-pulse w-1/2 rounded-full" />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
