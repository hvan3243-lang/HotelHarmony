import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Calendar, 
  User, 
  Clock, 
  Tag,
  ChevronRight,
  TrendingUp,
  Star,
  Eye
} from "lucide-react";
import { motion } from "framer-motion";

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

export default function Blog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const blogPosts: BlogPost[] = [
    {
      id: 1,
      title: "10 Điểm du lịch không thể bỏ qua tại Việt Nam",
      excerpt: "Khám phá những địa điểm tuyệt vời nhất mà Việt Nam có thể mang đến cho du khách trong và ngoài nước.",
      content: "Việt Nam là một đất nước với vẻ đẹp thiên nhiên hùng vĩ và văn hóa đa dạng...",
      author: "Nguyễn Văn A",
      date: "2024-01-15",
      readTime: "5 phút",
      category: "Du lịch",
      tags: ["Việt Nam", "Du lịch", "Khám phá"],
      image: "/api/placeholder/600/400"
    },
    {
      id: 2,
      title: "Bí quyết đặt phòng khách sạn giá tốt",
      excerpt: "Những mẹo hay giúp bạn tìm được phòng khách sạn chất lượng với mức giá phù hợp nhất.",
      content: "Việc đặt phòng khách sạn thông minh có thể giúp bạn tiết kiệm đáng kể chi phí...",
      author: "Trần Thị B",
      date: "2024-01-12",
      readTime: "7 phút",
      category: "Khách sạn",
      tags: ["Đặt phòng", "Tiết kiệm", "Mẹo hay"],
      image: "/api/placeholder/600/400"
    },
    {
      id: 3,
      title: "Trải nghiệm ẩm thực đặc sắc tại HotelLux",
      excerpt: "Hành trình khám phá hương vị độc đáo từ nhà hàng 5 sao của chúng tôi.",
      content: "Nhà hàng HotelLux tự hào mang đến những món ăn tinh tế nhất...",
      author: "Chef Minh",
      date: "2024-01-10",
      readTime: "4 phút",
      category: "Ẩm thực",
      tags: ["Nhà hàng", "Ẩm thực", "HotelLux"],
      image: "/api/placeholder/600/400"
    },
    {
      id: 4,
      title: "Xu hướng du lịch 2024: Những điểm đến hot nhất",
      excerpt: "Cập nhật những xu hướng du lịch mới nhất và các điểm đến được yêu thích trong năm 2024.",
      content: "Năm 2024 đánh dấu sự trở lại mạnh mẽ của ngành du lịch...",
      author: "Lê Văn C",
      date: "2024-01-08",
      readTime: "6 phút",
      category: "Xu hướng",
      tags: ["2024", "Xu hướng", "Hot trend"],
      image: "/api/placeholder/600/400"
    },
    {
      id: 5,
      title: "Spa & Wellness: Thư giãn hoàn hảo",
      excerpt: "Khám phá các dịch vụ spa cao cấp và phương pháp thư giãn tại HotelLux.",
      content: "Dịch vụ spa của chúng tôi được thiết kế để mang lại sự thư giãn tuyệt đối...",
      author: "Spa Manager",
      date: "2024-01-05",
      readTime: "5 phút",
      category: "Spa",
      tags: ["Spa", "Wellness", "Thư giãn"],
      image: "/api/placeholder/600/400"
    },
    {
      id: 6,
      title: "Hướng dẫn check-in thông minh",
      excerpt: "Quy trình check-in nhanh chóng và tiện lợi tại HotelLux để bạn có trải nghiệm tốt nhất.",
      content: "Với công nghệ hiện đại, việc check-in tại HotelLux trở nên đơn giản hơn bao giờ hết...",
      author: "Front Office",
      date: "2024-01-03",
      readTime: "3 phút",
      category: "Hướng dẫn",
      tags: ["Check-in", "Hướng dẫn", "Công nghệ"],
      image: "/api/placeholder/600/400"
    }
  ];

  const categories = ["all", "Du lịch", "Khách sạn", "Ẩm thức", "Xu hướng", "Spa", "Hướng dẫn"];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = blogPosts[0];
  const recentPosts = blogPosts.slice(1, 4);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">Blog HotelLux</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Khám phá những câu chuyện thú vị, mẹo du lịch và cập nhật mới nhất từ thế giới khách sạn
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              placeholder="Tìm kiếm bài viết..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category === "all" ? "Tất cả" : category}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Featured Post */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="h-64 lg:h-auto bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-white text-center">
                  <Star className="mx-auto mb-2" size={48} />
                  <span className="text-lg font-semibold">Bài viết nổi bật</span>
                </div>
              </div>
              <div className="p-8 flex flex-col justify-center">
                <Badge className="w-fit mb-3 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <TrendingUp className="mr-1" size={14} />
                  Nổi bật
                </Badge>
                <h2 className="text-2xl font-bold mb-3">{featuredPost.title}</h2>
                <p className="text-muted-foreground mb-4">{featuredPost.excerpt}</p>
                <div className="flex items-center text-sm text-muted-foreground mb-4">
                  <User className="mr-1" size={14} />
                  <span className="mr-4">{featuredPost.author}</span>
                  <Calendar className="mr-1" size={14} />
                  <span className="mr-4">{new Date(featuredPost.date).toLocaleDateString('vi-VN')}</span>
                  <Clock className="mr-1" size={14} />
                  <span>{featuredPost.readTime}</span>
                </div>
                <Button className="w-fit">
                  Đọc thêm
                  <ChevronRight className="ml-1" size={16} />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                    <div className="h-48 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                      <div className="text-white text-center">
                        <Eye className="mx-auto mb-2" size={24} />
                        <span className="text-sm font-medium">{post.category}</span>
                      </div>
                    </div>
                    <CardContent className="p-6 flex-1 flex flex-col">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="secondary">{post.category}</Badge>
                        {post.tags.slice(0, 2).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            <Tag className="mr-1" size={10} />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-3 line-clamp-2">
                        {post.title}
                      </h3>
                      
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3 flex-1">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <div className="flex items-center">
                          <User className="mr-1" size={12} />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="mr-1" size={12} />
                          <span>{new Date(post.date).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-1" size={12} />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                      
                      <Button variant="outline" className="w-full">
                        Đọc thêm
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">Trước</Button>
                <Button size="sm">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">Sau</Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Posts */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bài viết mới nhất</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentPosts.map((post) => (
                      <div key={post.id} className="flex space-x-3 pb-4 border-b last:border-b-0">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded flex-shrink-0 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold text-center">
                            {post.category}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2 mb-1">
                            {post.title}
                          </h4>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="mr-1" size={10} />
                            <span>{new Date(post.date).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Categories */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Danh mục</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categories.filter(cat => cat !== "all").map((category) => (
                      <Button
                        key={category}
                        variant="ghost"
                        className="w-full justify-between"
                        onClick={() => setSelectedCategory(category)}
                      >
                        <span>{category}</span>
                        <Badge variant="secondary">
                          {blogPosts.filter(post => post.category === category).length}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Newsletter */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Đăng ký nhận tin</h3>
                  <p className="text-blue-100 mb-4 text-sm">
                    Nhận thông tin mới nhất về du lịch và ưu đãi đặc biệt từ HotelLux
                  </p>
                  <div className="space-y-3">
                    <Input
                      placeholder="Email của bạn"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/70"
                    />
                    <Button className="w-full bg-white text-blue-600 hover:bg-white/90">
                      Đăng ký ngay
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-muted-foreground" size={32} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Không tìm thấy bài viết</h3>
            <p className="text-muted-foreground mb-4">
              Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
            }}>
              Xem tất cả bài viết
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}