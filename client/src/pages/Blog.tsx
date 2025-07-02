import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User, Search, Tag } from "lucide-react";

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  image: string;
}

const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Top 10 địa điểm du lịch không thể bỏ qua tại Sài Gòn",
    excerpt: "Khám phá những địa điểm tuyệt vời nhất của thành phố Hồ Chí Minh với hướng dẫn chi tiết từ chuyên gia du lịch.",
    content: "Sài Gòn là một thành phố sôi động với nhiều điểm tham quan thú vị...",
    author: "Nguyễn Văn An",
    date: "2025-01-02",
    readTime: "5 phút",
    category: "Du lịch",
    tags: ["Sài Gòn", "Du lịch", "Khám phá"],
    image: "/api/placeholder/400/200"
  },
  {
    id: 2,
    title: "Bí quyết lựa chọn phòng khách sạn phù hợp",
    excerpt: "Hướng dẫn cách chọn phòng khách sạn tốt nhất cho chuyến đi của bạn với những tiêu chí quan trọng.",
    content: "Khi đặt phòng khách sạn, có nhiều yếu tố cần xem xét...",
    author: "Trần Thị Bích",
    date: "2024-12-28",
    readTime: "7 phút",
    category: "Mẹo hay",
    tags: ["Khách sạn", "Đặt phòng", "Mẹo hay"],
    image: "/api/placeholder/400/200"
  },
  {
    id: 3,
    title: "Ẩm thực Việt Nam - Hành trình khám phá hương vị",
    excerpt: "Cùng khám phá văn hóa ẩm thực phong phú của Việt Nam qua những món ăn đặc trưng của từng vùng miền.",
    content: "Ẩm thực Việt Nam nổi tiếng thế giới với sự đa dạng và phong phú...",
    author: "Lê Minh Hải",
    date: "2024-12-25",
    readTime: "10 phút",
    category: "Ẩm thực",
    tags: ["Ẩm thực", "Văn hóa", "Việt Nam"],
    image: "/api/placeholder/400/200"
  },
  {
    id: 4,
    title: "Xu hướng du lịch bền vững năm 2025",
    excerpt: "Tìm hiểu về xu hướng du lịch bền vững và cách du lịch có trách nhiệm với môi trường.",
    content: "Du lịch bền vững đang trở thành xu hướng chính trong ngành du lịch...",
    author: "Phạm Thu Hà",
    date: "2024-12-20",
    readTime: "8 phút",
    category: "Xu hướng",
    tags: ["Du lịch bền vững", "Môi trường", "Xu hướng"],
    image: "/api/placeholder/400/200"
  }
];

const categories = ["Tất cả", "Du lịch", "Mẹo hay", "Ẩm thực", "Xu hướng"];

export default function Blog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Tất cả" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button 
            onClick={() => setSelectedPost(null)}
            variant="outline"
            className="mb-6"
          >
            ← Quay lại danh sách bài viết
          </Button>
          
          <Card>
            <div className="aspect-video w-full bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
            <CardHeader>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {selectedPost.author}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(selectedPost.date).toLocaleDateString('vi-VN')}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {selectedPost.readTime}
                </div>
              </div>
              <CardTitle className="text-3xl">{selectedPost.title}</CardTitle>
              <div className="flex gap-2 mt-4">
                <Badge variant="secondary">{selectedPost.category}</Badge>
                {selectedPost.tags.map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="text-xl font-medium text-gray-600 dark:text-gray-300 mb-6">
                  {selectedPost.excerpt}
                </p>
                <div className="space-y-4">
                  <p>{selectedPost.content}</p>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                    incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
                    nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                  </p>
                  <p>
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
                    eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, 
                    sunt in culpa qui officia deserunt mollit anim id est laborum.
                  </p>
                  <h3 className="text-2xl font-bold mt-8 mb-4">Kết luận</h3>
                  <p>
                    Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium 
                    doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore 
                    veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Blog du lịch
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Khám phá những câu chuyện thú vị về du lịch và khách sạn
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                size="sm"
              >
                <Tag className="h-4 w-4 mr-1" />
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map(post => (
            <Card key={post.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <div className="aspect-video w-full bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
              <CardHeader>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(post.date).toLocaleDateString('vi-VN')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {post.readTime}
                  </div>
                </div>
                <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                <CardDescription className="line-clamp-3">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">{post.category}</Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedPost(post)}
                  >
                    Đọc thêm →
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Không tìm thấy bài viết nào phù hợp với tìm kiếm của bạn.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}