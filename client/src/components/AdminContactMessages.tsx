import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, 
  Eye, 
  Reply, 
  Clock, 
  CheckCircle, 
  Mail, 
  Phone,
  User,
  Filter,
  Search,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  category: string;
  subject?: string;
  message: string;
  preferredContact: string;
  status: 'pending' | 'responded' | 'closed';
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
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
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
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/contact-messages', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
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
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/contact-messages/${messageId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ response: responseText }),
      });

      if (response.ok) {
        toast({
          title: "Phản hồi đã được gửi!",
          description: "Tin nhắn phản hồi đã được lưu thành công",
        });
        setResponseText("");
        setSelectedMessage(null);
        fetchMessages();
      } else {
        throw new Error('Failed to send response');
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
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/contact-messages/${messageId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Chờ xử lý</Badge>;
      case 'responded':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Đã phản hồi</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Đã đóng</Badge>;
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
      other: "bg-gray-500"
    };
    return colors[category as keyof typeof colors] || "bg-gray-500";
  };

  const filteredMessages = messages.filter(message => {
    const matchesStatus = statusFilter === "all" || message.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || message.category === categoryFilter;
    const matchesSearch = !searchTerm || 
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <MessageSquare className="mr-2" size={24} />
            Tin nhắn liên hệ
          </h2>
          <p className="text-muted-foreground">Quản lý và phản hồi tin nhắn từ khách hàng</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ xử lý</SelectItem>
              <SelectItem value="responded">Đã phản hồi</SelectItem>
              <SelectItem value="closed">Đã đóng</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
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
      </div>

      {/* Messages List */}
      <div className="grid gap-4">
        {filteredMessages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getCategoryColor(message.category)}`} />
                        <div>
                          <h3 className="font-semibold flex items-center">
                            <User className="mr-2" size={16} />
                            {message.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{message.email}</p>
                        </div>
                      </div>
                      {getStatusBadge(message.status)}
                    </div>
                    
                    {message.subject && (
                      <h4 className="font-medium mb-2">Tiêu đề: {message.subject}</h4>
                    )}
                    
                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {message.message}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="mr-1" size={14} />
                        {new Date(message.createdAt).toLocaleString('vi-VN')}
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline">{message.category}</Badge>
                      </div>
                      {message.phone && (
                        <div className="flex items-center">
                          <Phone className="mr-1" size={14} />
                          {message.phone}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Mail className="mr-1" size={14} />
                        Ưu tiên: {message.preferredContact}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 lg:w-48">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="h-8 px-3"
                          onClick={() => setSelectedMessage(message)}
                        >
                          <Eye className="mr-2" size={16} />
                          Xem chi tiết
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Chi tiết tin nhắn liên hệ</DialogTitle>
                        </DialogHeader>
                        
                        {selectedMessage && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Họ tên</Label>
                                <p className="font-medium">{selectedMessage.name}</p>
                              </div>
                              <div>
                                <Label>Email</Label>
                                <p className="font-medium">{selectedMessage.email}</p>
                              </div>
                              {selectedMessage.phone && (
                                <div>
                                  <Label>Số điện thoại</Label>
                                  <p className="font-medium">{selectedMessage.phone}</p>
                                </div>
                              )}
                              <div>
                                <Label>Chủ đề</Label>
                                <p className="font-medium">{selectedMessage.category}</p>
                              </div>
                            </div>
                            
                            {selectedMessage.subject && (
                              <div>
                                <Label>Tiêu đề</Label>
                                <p className="font-medium">{selectedMessage.subject}</p>
                              </div>
                            )}
                            
                            <div>
                              <Label>Nội dung tin nhắn</Label>
                              <div className="bg-muted p-3 rounded-lg mt-1">
                                <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                              </div>
                            </div>
                            
                            {selectedMessage.adminResponse && (
                              <div>
                                <Label>Phản hồi của admin</Label>
                                <div className="bg-blue-50 p-3 rounded-lg mt-1 border-l-4 border-blue-500">
                                  <p className="whitespace-pre-wrap">{selectedMessage.adminResponse}</p>
                                  {selectedMessage.respondedByUser && (
                                    <div className="text-sm text-muted-foreground mt-2">
                                      Phản hồi bởi: {selectedMessage.respondedByUser.firstName} {selectedMessage.respondedByUser.lastName}
                                      {selectedMessage.respondedAt && (
                                        <span> vào {new Date(selectedMessage.respondedAt).toLocaleString('vi-VN')}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {selectedMessage.status === 'pending' && (
                              <div className="space-y-3">
                                <Label>Phản hồi</Label>
                                <Textarea
                                  value={responseText}
                                  onChange={(e) => setResponseText(e.target.value)}
                                  placeholder="Nhập phản hồi cho khách hàng..."
                                  rows={4}
                                />
                                <Button 
                                  onClick={() => handleRespond(selectedMessage.id)}
                                  disabled={isSubmitting}
                                  className="w-full"
                                >
                                  {isSubmitting ? "Đang gửi..." : (
                                    <>
                                      <Reply className="mr-2" size={16} />
                                      Gửi phản hồi
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <Select 
                      value={message.status} 
                      onValueChange={(value) => handleStatusChange(message.id, value)}
                    >
                      <SelectTrigger className="h-8">
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
      </div>
      
      {filteredMessages.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="mx-auto mb-4 text-muted-foreground" size={48} />
            <h3 className="text-lg font-semibold mb-2">Không có tin nhắn nào</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all" || categoryFilter !== "all" 
                ? "Không tìm thấy tin nhắn phù hợp với bộ lọc" 
                : "Chưa có tin nhắn liên hệ nào từ khách hàng"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}