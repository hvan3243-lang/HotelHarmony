import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Search, 
  Calendar, 
  User, 
  Clock, 
  Tag,
  ChevronRight,
  TrendingUp,
  Star,
  Eye,
  BookOpen,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import type { BlogPost } from "@shared/schema";

export default function Blog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);

  // Fetch blog posts from API
  const { data: blogPosts, isLoading } = useQuery({
    queryKey: ['/api/blog'],
  });

  // Filter published posts only
  const publishedPosts = Array.isArray(blogPosts) ? 
    (blogPosts as BlogPost[]).filter(post => post.published) : [];

  // Filter posts based on search and category
  const filteredPosts = publishedPosts.filter((post: BlogPost) => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from published posts
  const categories = Array.from(new Set(publishedPosts.map((post: BlogPost) => post.category)));

  // Function to open post detail dialog
  const handleReadMore = (post: BlogPost) => {
    setSelectedPost(post);
    setIsPostDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p>Đang tải bài viết...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Blog HotelLux
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Khám phá những câu chuyện du lịch, mẹo hay và tin tức mới nhất từ HotelLux
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <Input
                    placeholder="Tìm kiếm bài viết..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 border-0 bg-slate-100 dark:bg-slate-700"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory('all')}
                    className="h-12"
                  >
                    Tất cả
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      onClick={() => setSelectedCategory(category)}
                      className="h-12"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Blog Posts */}
        {filteredPosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16"
          >
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8">
                <BookOpen className="mx-auto mb-4 text-muted-foreground" size={48} />
                <h3 className="text-lg font-semibold mb-2">Chưa có bài viết</h3>
                <p className="text-muted-foreground">
                  {publishedPosts.length === 0 
                    ? "Chưa có bài viết nào được xuất bản" 
                    : "Không tìm thấy bài viết phù hợp với tìm kiếm của bạn"
                  }
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post: BlogPost, index: number) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
              >
                <Card className="h-full hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-sm bg-white/90 dark:bg-slate-800/90 border-0">
                  {post.image && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  )}
                  
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        {post.category}
                      </Badge>
                      <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                        <Clock size={14} className="mr-1" />
                        {post.readTime || 5} phút
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-2">
                      {post.title}
                    </h3>

                    {post.excerpt && (
                      <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                        <User size={14} className="mr-1" />
                        {post.author}
                      </div>
                      <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                        <Calendar size={14} className="mr-1" />
                        {post.createdAt ? format(new Date(post.createdAt), 'dd/MM/yyyy') : 'N/A'}
                      </div>
                    </div>

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {post.tags.slice(0, 3).map((tag: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {post.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{post.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <Button 
                      className="w-full group"
                      onClick={() => handleReadMore(post)}
                    >
                      Đọc thêm
                      <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Statistics */}
        {publishedPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16"
          >
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">
                      {publishedPosts.length}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300">
                      Bài viết đã xuất bản
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">
                      {categories.length}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300">
                      Danh mục
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-primary mb-2">
                      {Array.from(new Set(publishedPosts.map((post: BlogPost) => post.author))).length}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300">
                      Tác giả
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Blog Post Detail Dialog */}
        <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold pr-8">
                {selectedPost?.title}
              </DialogTitle>
            </DialogHeader>
            
            {selectedPost && (
              <div className="space-y-6">
                {/* Post Meta */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-b pb-4">
                  <div className="flex items-center">
                    <User size={16} className="mr-2" />
                    {selectedPost.author}
                  </div>
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2" />
                    {selectedPost.createdAt ? format(new Date(selectedPost.createdAt), 'dd/MM/yyyy') : 'N/A'}
                  </div>
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2" />
                    {selectedPost.readTime || 5} phút đọc
                  </div>
                  <Badge variant="secondary">
                    {selectedPost.category}
                  </Badge>
                </div>

                {/* Featured Image */}
                {selectedPost.image && (
                  <div className="relative h-64 md:h-80 overflow-hidden rounded-lg">
                    <img
                      src={selectedPost.image}
                      alt={selectedPost.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Excerpt */}
                {selectedPost.excerpt && (
                  <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                    <p className="text-lg italic text-muted-foreground">
                      {selectedPost.excerpt}
                    </p>
                  </div>
                )}

                {/* Content */}
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {selectedPost.content}
                  </div>
                </div>

                {/* Tags */}
                {selectedPost.tags && selectedPost.tags.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag size={16} className="text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Tags:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedPost.tags.map((tag: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}