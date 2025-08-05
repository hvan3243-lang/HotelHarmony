import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle,
  Eye,
  Mail,
  MessageSquare,
  Phone,
  Reply,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  category: string;
  subject?: string;
  message: string;
  preferredContact: string;
  status: "pending" | "responded" | "closed";
  adminResponse?: string;
  respondedBy?: number;
  respondedAt?: string;
  createdAt: string;
  respondedByUser?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export function AdminContactMessages() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(
    null
  );
  const [responseText, setResponseText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await apiRequest("GET", "/api/admin/contact-messages");
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      toast({
        title: "Lỗi tải tin nhắn",
        description: "Không thể tải danh sách tin nhắn liên hệ",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (messageId: number) => {
    if (!responseText.trim()) {
      toast({
        title: "Vui lòng nhập phản hồi",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest(
        "POST",
        `/api/admin/contact-messages/${messageId}/respond`,
        {
          response: responseText,
        }
      );

      if (response.ok) {
        toast({
          title: "Phản hồi đã được gửi!",
          description: "Tin nhắn phản hồi đã được lưu thành công",
        });
        setResponseText("");
        setSelectedMessage(null);
        fetchMessages();
      } else {
        throw new Error("Failed to send response");
      }
    } catch (error) {
      toast({
        title: "Lỗi gửi phản hồi",
        description: "Không thể gửi phản hồi, vui lòng thử lại",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (messageId: number, newStatus: string) => {
    try {
      const response = await apiRequest(
        "PUT",
        `/api/admin/contact-messages/${messageId}/status`,
        {
          status: newStatus,
        }
      );

      if (response.ok) {
        toast({
          title: "Cập nhật trạng thái thành công",
        });
        fetchMessages();
      }
    } catch (error) {
      toast({
        title: "Lỗi cập nhật trạng thái",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (messageId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tin nhắn này không?")) {
      return;
    }

    try {
      const response = await apiRequest(
        "DELETE",
        `/api/admin/contact-messages/${messageId}`
      );

      if (response.ok) {
        toast({
          title: "Xóa tin nhắn thành công",
          description: "Tin nhắn đã được xóa khỏi hệ thống",
        });
        fetchMessages();
      }
    } catch (error) {
      toast({
        title: "Lỗi xóa tin nhắn",
        description: "Không thể xóa tin nhắn này",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Chờ xử lý
          </Badge>
        );
      case "responded":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Đã phản hồi
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Đã đóng
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      booking: "bg-blue-500",
      inquiry: "bg-green-500",
      complaint: "bg-red-500",
      feedback: "bg-purple-500",
      partnership: "bg-orange-500",
      other: "bg-gray-500",
    };
    return colors[category as keyof typeof colors] || "bg-gray-500";
  };

  const filteredMessages = messages.filter((message) => {
    const matchesStatus =
      statusFilter === "all" || message.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || message.category === categoryFilter;
    const matchesSearch =
      !searchTerm ||
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesCategory && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 shadow-2xl border-0">
          <CardContent className="p-8">
            <div className="text-center text-white">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm"
              >
                <MessageSquare className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-4xl font-bold mb-3">Tin nhắn liên hệ</h2>
              <p className="text-indigo-100 text-lg">
                Quản lý và phản hồi tin nhắn từ khách hàng
              </p>
              <div className="mt-6 flex justify-center space-x-8 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                  <span>Chờ xử lý</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span>Đã phản hồi</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span>Đã đóng</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <Card className="bg-white/80 backdrop-blur-sm border-indigo-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-500"
                    size={18}
                  />
                  <Input
                    placeholder="Tìm kiếm tin nhắn..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="pending">Chờ xử lý</SelectItem>
                    <SelectItem value="responded">Đã phản hồi</SelectItem>
                    <SelectItem value="closed">Đã đóng</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-40 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500">
                    <SelectValue placeholder="Chủ đề" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="booking">Đặt phòng</SelectItem>
                    <SelectItem value="inquiry">Tư vấn</SelectItem>
                    <SelectItem value="complaint">Khiếu nại</SelectItem>
                    <SelectItem value="feedback">Góp ý</SelectItem>
                    <SelectItem value="partnership">Hợp tác</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Badge
                  variant="outline"
                  className="bg-indigo-50 text-indigo-700 border-indigo-200"
                >
                  {filteredMessages.length} tin nhắn
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Messages List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="grid gap-6"
      >
        {filteredMessages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="group"
          >
            <Card className="bg-gradient-to-br from-white to-indigo-50 border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-indigo-300">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-4 h-4 rounded-full ${getCategoryColor(
                            message.category
                          )} shadow-sm`}
                        />
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">
                              {message.name}
                            </h3>
                            <p className="text-sm text-indigo-600 font-medium">
                              {message.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(message.status)}
                        <Badge
                          variant="outline"
                          className="bg-indigo-50 text-indigo-700 border-indigo-200"
                        >
                          {message.category}
                        </Badge>
                      </div>
                    </div>

                    {message.subject && (
                      <h4 className="font-semibold text-gray-800 mb-3 text-lg">
                        📧 {message.subject}
                      </h4>
                    )}

                    <div className="bg-white/60 p-4 rounded-lg border border-indigo-100 mb-4">
                      <p className="text-gray-700 line-clamp-3 leading-relaxed">
                        {message.message}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center bg-indigo-50 px-3 py-1 rounded-full">
                        <Calendar className="mr-2 text-indigo-600" size={14} />
                        <span className="text-indigo-700 font-medium">
                          {new Date(message.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      {message.phone && (
                        <div className="flex items-center bg-green-50 px-3 py-1 rounded-full">
                          <Phone className="mr-2 text-green-600" size={14} />
                          <span className="text-green-700 font-medium">
                            {message.phone}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center bg-purple-50 px-3 py-1 rounded-full">
                        <Mail className="mr-2 text-purple-600" size={14} />
                        <span className="text-purple-700 font-medium">
                          Ưu tiên: {message.preferredContact}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:w-48">
                    <Dialog>
                      <DialogTrigger asChild>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="outline"
                            className="h-10 px-4 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300"
                            onClick={() => setSelectedMessage(message)}
                          >
                            <Eye className="mr-2" size={16} />
                            Xem chi tiết
                          </Button>
                        </motion.div>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl bg-gradient-to-br from-white to-indigo-50 border-indigo-200 shadow-2xl">
                        <DialogHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg -m-6 mb-6 p-6">
                          <DialogTitle className="flex items-center text-xl">
                            <MessageSquare className="mr-3" size={24} />
                            Chi tiết tin nhắn liên hệ
                          </DialogTitle>
                        </DialogHeader>

                        {selectedMessage && (
                          <div className="space-y-6">
                            {/* Customer Info */}
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
                              <h3 className="font-bold text-lg text-indigo-800 mb-4 flex items-center">
                                <User className="mr-2" size={20} />
                                Thông tin khách hàng
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-lg border border-indigo-100">
                                  <Label className="text-indigo-600 font-medium">
                                    Họ tên
                                  </Label>
                                  <p className="font-semibold text-gray-800 mt-1">
                                    {selectedMessage.name}
                                  </p>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-indigo-100">
                                  <Label className="text-indigo-600 font-medium">
                                    Email
                                  </Label>
                                  <p className="font-semibold text-gray-800 mt-1">
                                    {selectedMessage.email}
                                  </p>
                                </div>
                                {selectedMessage.phone && (
                                  <div className="bg-white p-4 rounded-lg border border-indigo-100">
                                    <Label className="text-indigo-600 font-medium">
                                      Số điện thoại
                                    </Label>
                                    <p className="font-semibold text-gray-800 mt-1">
                                      {selectedMessage.phone}
                                    </p>
                                  </div>
                                )}
                                <div className="bg-white p-4 rounded-lg border border-indigo-100">
                                  <Label className="text-indigo-600 font-medium">
                                    Chủ đề
                                  </Label>
                                  <p className="font-semibold text-gray-800 mt-1">
                                    {selectedMessage.category}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Message Content */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                              <h3 className="font-bold text-lg text-blue-800 mb-4 flex items-center">
                                <MessageSquare className="mr-2" size={20} />
                                Nội dung tin nhắn
                              </h3>
                              {selectedMessage.subject && (
                                <div className="bg-white p-4 rounded-lg border border-blue-100 mb-4">
                                  <Label className="text-blue-600 font-medium">
                                    Tiêu đề
                                  </Label>
                                  <p className="font-semibold text-gray-800 mt-1">
                                    {selectedMessage.subject}
                                  </p>
                                </div>
                              )}

                              <div className="bg-white p-4 rounded-lg border border-blue-100">
                                <Label className="text-blue-600 font-medium">
                                  Nội dung
                                </Label>
                                <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                  <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                                    {selectedMessage.message}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {selectedMessage.adminResponse && (
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                                <h3 className="font-bold text-lg text-green-800 mb-4 flex items-center">
                                  <CheckCircle className="mr-2" size={20} />
                                  Phản hồi của admin
                                </h3>
                                <div className="bg-white p-4 rounded-lg border border-green-100">
                                  <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                                    <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                                      {selectedMessage.adminResponse}
                                    </p>
                                    {selectedMessage.respondedByUser && (
                                      <div className="text-sm text-green-600 mt-3 font-medium">
                                        <span className="font-semibold">
                                          Phản hồi bởi:
                                        </span>{" "}
                                        {
                                          selectedMessage.respondedByUser
                                            .firstName
                                        }{" "}
                                        {
                                          selectedMessage.respondedByUser
                                            .lastName
                                        }
                                        {selectedMessage.respondedAt && (
                                          <span>
                                            {" "}
                                            vào{" "}
                                            {new Date(
                                              selectedMessage.respondedAt
                                            ).toLocaleString("vi-VN")}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {selectedMessage.status === "pending" && (
                              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200">
                                <h3 className="font-bold text-lg text-orange-800 mb-4 flex items-center">
                                  <Reply className="mr-2" size={20} />
                                  Phản hồi cho khách hàng
                                </h3>
                                <div className="space-y-4">
                                  <div>
                                    <Label className="text-orange-600 font-medium">
                                      Nội dung phản hồi
                                    </Label>
                                    <Textarea
                                      value={responseText}
                                      onChange={(e) =>
                                        setResponseText(e.target.value)
                                      }
                                      placeholder="Nhập phản hồi cho khách hàng..."
                                      rows={4}
                                      className="mt-2 border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                                    />
                                  </div>
                                  <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <Button
                                      onClick={() =>
                                        handleRespond(selectedMessage.id)
                                      }
                                      disabled={isSubmitting}
                                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                    >
                                      {isSubmitting ? (
                                        "Đang gửi..."
                                      ) : (
                                        <>
                                          <Reply className="mr-2" size={18} />
                                          Gửi phản hồi
                                        </>
                                      )}
                                    </Button>
                                  </motion.div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="destructive"
                        className="h-10 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                        onClick={() => handleDelete(message.id)}
                      >
                        <Trash2 className="mr-2" size={16} />
                        Xóa
                      </Button>
                    </motion.div>

                    <Select
                      value={message.status}
                      onValueChange={(value) =>
                        handleStatusChange(message.id, value)
                      }
                    >
                      <SelectTrigger className="h-10 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Chờ xử lý</SelectItem>
                        <SelectItem value="responded">Đã phản hồi</SelectItem>
                        <SelectItem value="closed">Đã đóng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {filteredMessages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-white to-indigo-50 border-indigo-200 shadow-xl">
            <CardContent className="text-center py-16">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mx-auto w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mb-6"
              >
                <MessageSquare className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Không có tin nhắn nào
              </h3>
              <p className="text-indigo-600 text-lg">
                {searchTerm ||
                statusFilter !== "all" ||
                categoryFilter !== "all"
                  ? "Không tìm thấy tin nhắn phù hợp với bộ lọc"
                  : "Chưa có tin nhắn liên hệ nào từ khách hàng"}
              </p>
              <div className="mt-6 flex justify-center">
                <Badge
                  variant="outline"
                  className="bg-indigo-50 text-indigo-700 border-indigo-200 px-4 py-2"
                >
                  Tất cả tin nhắn đã được xử lý! 🎉
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
