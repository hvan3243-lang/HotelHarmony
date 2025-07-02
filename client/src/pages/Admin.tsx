import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  TrendingUp, 
  Bed, 
  Users, 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Download,
  BarChart3,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MessageCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Room, Booking, User as UserType } from "@shared/schema";
import { useEffect } from "react";
import { LiveChat } from "@/components/LiveChat";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roomForm, setRoomForm] = useState({
    number: "",
    type: "",
    price: "",
    capacity: "",
    amenities: [] as string[],
    description: "",
    images: [] as string[],
  });
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  
  // Get chat user ID from URL parameter for admin chat functionality
  const urlParams = new URLSearchParams(window.location.search);
  const chatUserId = urlParams.get('chatUserId') ? parseInt(urlParams.get('chatUserId')!) : undefined;

  useEffect(() => {
    const user = authManager.getUser();
    if (!user || user.role !== 'admin') {
      setLocation("/auth");
      return;
    }
  }, [setLocation]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ["/api/rooms"],
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings"],
  });

  const createRoomMutation = useMutation({
    mutationFn: (roomData: any) => apiRequest("POST", "/api/rooms", roomData),
    onSuccess: () => {
      toast({
        title: "Thêm phòng thành công",
        description: "Phòng mới đã được thêm vào hệ thống",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowRoomDialog(false);
      resetRoomForm();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi thêm phòng",
        description: error.message || "Có lỗi xảy ra khi thêm phòng",
        variant: "destructive",
      });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest("PUT", `/api/rooms/${id}`, data),
    onSuccess: () => {
      toast({
        title: "Cập nhật phòng thành công",
        description: "Thông tin phòng đã được cập nhật",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      setShowRoomDialog(false);
      setEditingRoom(null);
      resetRoomForm();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi cập nhật phòng",
        description: error.message || "Có lỗi xảy ra khi cập nhật phòng",
        variant: "destructive",
      });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/rooms/${id}`, {}),
    onSuccess: () => {
      toast({
        title: "Xóa phòng thành công",
        description: "Phòng đã được xóa khỏi hệ thống",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi xóa phòng",
        description: error.message || "Có lỗi xảy ra khi xóa phòng",
        variant: "destructive",
      });
    },
  });

  const resetRoomForm = () => {
    setRoomForm({
      number: "",
      type: "",
      price: "",
      capacity: "",
      amenities: [],
      description: "",
      images: [],
    });
    setEditingRoom(null);
  };

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const roomData = {
      ...roomForm,
      price: parseFloat(roomForm.price).toString(),
      capacity: parseInt(roomForm.capacity),
      amenities: roomForm.amenities,
      images: roomForm.images,
    };

    if (editingRoom) {
      updateRoomMutation.mutate({ id: editingRoom.id, data: roomData });
    } else {
      createRoomMutation.mutate(roomData);
    }
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomForm({
      number: room.number,
      type: room.type,
      price: room.price,
      capacity: room.capacity.toString(),
      amenities: room.amenities || [],
      description: room.description || "",
      images: room.images || [],
    });
    setShowRoomDialog(true);
  };

  const handleDeleteRoom = (room: Room) => {
    if (window.confirm(`Bạn có chắc muốn xóa phòng ${room.number}?`)) {
      deleteRoomMutation.mutate(room.id);
    }
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('vi-VN').format(parseFloat(price)) + "đ";
  };

  const getRoomTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      standard: "Standard",
      deluxe: "Deluxe",
      suite: "Suite", 
      presidential: "Presidential",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      available: { variant: "default", label: "Trống", icon: CheckCircle },
      booked: { variant: "destructive", label: "Đã đặt", icon: XCircle },
      maintenance: { variant: "secondary", label: "Bảo trì", icon: Clock },
      pending: { variant: "default", label: "Đang chờ", icon: Clock },
      confirmed: { variant: "default", label: "Đã xác nhận", icon: CheckCircle },
      completed: { variant: "default", label: "Hoàn thành", icon: CheckCircle },
      cancelled: { variant: "destructive", label: "Đã hủy", icon: XCircle },
    };
    return variants[status] || { variant: "secondary", label: status, icon: Clock };
  };

  const filteredRooms = rooms.filter((room: Room) => {
    if (!searchTerm) return true;
    return (
      room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const recentBookings = bookings.slice(0, 5);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Admin Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold flex items-center">
              <BarChart3 className="mr-3 text-primary" />
              Dashboard Quản Lý
            </h1>
            <p className="text-muted-foreground mt-2">Tổng quan hệ thống khách sạn</p>
          </div>
          <div className="flex space-x-4">
            <Button onClick={() => setShowRoomDialog(true)}>
              <Plus className="mr-2" size={16} />
              Thêm phòng
            </Button>
            <Button variant="outline">
              <Download className="mr-2" size={16} />
              Xuất báo cáo
            </Button>
          </div>
        </motion.div>

        {/* Chat Instructions for Admin */}
        {chatUserId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <MessageCircle className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      Đang trò chuyện với khách hàng #{chatUserId}
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Nhấn vào biểu tượng chat ở góc dưới bên phải để trả lời tin nhắn khách hàng
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-12 bg-muted rounded mb-4"></div>
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Bed className="text-blue-600" size={24} />
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        +12%
                      </Badge>
                    </div>
                    <h3 className="text-2xl font-bold">{stats?.totalRooms || 0}</h3>
                    <p className="text-muted-foreground">Tổng số phòng</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <CheckCircle className="text-green-600" size={24} />
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        +8%
                      </Badge>
                    </div>
                    <h3 className="text-2xl font-bold">{stats?.occupancyRate || 0}%</h3>
                    <p className="text-muted-foreground">Tỷ lệ lấp đầy</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                        <Users className="text-amber-600" size={24} />
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        +15%
                      </Badge>
                    </div>
                    <h3 className="text-2xl font-bold">{stats?.totalCustomers || 0}</h3>
                    <p className="text-muted-foreground">Khách hàng</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <DollarSign className="text-primary" size={24} />
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        +22%
                      </Badge>
                    </div>
                    <h3 className="text-2xl font-bold">
                      {stats?.totalRevenue ? formatPrice(stats.totalRevenue.toString()) : "0đ"}
                    </h3>
                    <p className="text-muted-foreground">Doanh thu</p>
                  </CardContent>
                </Card>
              </motion.div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* Revenue Chart Placeholder */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="xl:col-span-2"
          >
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2" size={20} />
                    Doanh Thu Theo Tháng
                  </CardTitle>
                  <Select defaultValue="12">
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 tháng qua</SelectItem>
                      <SelectItem value="6">6 tháng qua</SelectItem>
                      <SelectItem value="12">12 tháng qua</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <p className="text-muted-foreground">
                      Biểu đồ doanh thu sẽ được hiển thị ở đây
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Bookings */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2" size={20} />
                  Đặt Phòng Gần Đây
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-muted rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : recentBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto mb-4 text-muted-foreground" size={32} />
                    <p className="text-muted-foreground">Chưa có đặt phòng nào</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentBookings.map((booking: any, index) => {
                      const statusInfo = getStatusBadge(booking.status);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <div key={booking.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                          <div className={`w-2 h-2 rounded-full ${
                            booking.status === 'confirmed' ? 'bg-green-500 animate-pulse' :
                            booking.status === 'pending' ? 'bg-blue-500' :
                            booking.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-500'
                          }`}></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {booking.user?.firstName} {booking.user?.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getRoomTypeLabel(booking.room?.type)} • {Math.floor(Math.random() * 60)} phút trước
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-primary">
                            {formatPrice(booking.totalPrice)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Management Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <Tabs defaultValue="rooms" className="w-full">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="rooms" className="flex items-center">
                    <Bed className="mr-2" size={16} />
                    Quản lý phòng
                  </TabsTrigger>
                  <TabsTrigger value="customers" className="flex items-center">
                    <Users className="mr-2" size={16} />
                    Quản lý khách hàng
                  </TabsTrigger>
                  <TabsTrigger value="staff" className="flex items-center">
                    <Users className="mr-2" size={16} />
                    Quản lý nhân viên
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                {/* Room Management Tab */}
                <TabsContent value="rooms" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Danh Sách Phòng</h3>
                    <div className="flex space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                          placeholder="Tìm kiếm phòng..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <Button onClick={() => {
                        setEditingRoom(null);
                        resetRoomForm();
                        setShowRoomDialog(true);
                      }}>
                        <Plus className="mr-2" size={16} />
                        Thêm phòng
                      </Button>
                    </div>
                  </div>

                  {roomsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-16 bg-muted rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-semibold">Số phòng</th>
                            <th className="text-left py-3 px-4 font-semibold">Loại phòng</th>
                            <th className="text-left py-3 px-4 font-semibold">Giá/đêm</th>
                            <th className="text-left py-3 px-4 font-semibold">Sức chứa</th>
                            <th className="text-left py-3 px-4 font-semibold">Trạng thái</th>
                            <th className="text-left py-3 px-4 font-semibold">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRooms.map((room: Room) => {
                            const statusInfo = getStatusBadge(room.status);
                            return (
                              <tr key={room.id} className="border-b hover:bg-muted/50">
                                <td className="py-4 px-4 font-medium">{room.number}</td>
                                <td className="py-4 px-4">{getRoomTypeLabel(room.type)}</td>
                                <td className="py-4 px-4 font-semibold">{formatPrice(room.price)}</td>
                                <td className="py-4 px-4">{room.capacity} khách</td>
                                <td className="py-4 px-4">
                                  <Badge variant={statusInfo.variant as any}>
                                    {statusInfo.label}
                                  </Badge>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditRoom(room)}
                                    >
                                      <Edit size={14} />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteRoom(room)}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                {/* Customer Management Tab */}
                <TabsContent value="customers" className="space-y-6">
                  <div className="text-center py-12">
                    <Users className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <h3 className="text-lg font-semibold mb-2">Quản lý khách hàng</h3>
                    <p className="text-muted-foreground">Tính năng này đang được phát triển</p>
                  </div>
                </TabsContent>

                {/* Staff Management Tab */}
                <TabsContent value="staff" className="space-y-6">
                  <div className="text-center py-12">
                    <Users className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <h3 className="text-lg font-semibold mb-2">Quản lý nhân viên</h3>
                    <p className="text-muted-foreground">Tính năng này đang được phát triển</p>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </motion.div>

        {/* Room Form Dialog */}
        <Dialog open={showRoomDialog} onOpenChange={setShowRoomDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRoom ? "Chỉnh sửa phòng" : "Thêm phòng mới"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRoomSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="number">Số phòng</Label>
                  <Input
                    id="number"
                    value={roomForm.number}
                    onChange={(e) => setRoomForm(prev => ({ ...prev, number: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Loại phòng</Label>
                  <Select value={roomForm.type} onValueChange={(value) => setRoomForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại phòng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="deluxe">Deluxe</SelectItem>
                      <SelectItem value="suite">Suite</SelectItem>
                      <SelectItem value="presidential">Presidential</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Giá/đêm (VNĐ)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={roomForm.price}
                    onChange={(e) => setRoomForm(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Sức chứa</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm(prev => ({ ...prev, capacity: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={roomForm.description}
                  onChange={(e) => setRoomForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả về phòng..."
                />
              </div>

              <div>
                <Label>Tiện nghi</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {["WiFi", "TV", "AC", "Balcony", "Ocean View", "City View", "Jacuzzi", "Minibar", "Room Service"].map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={amenity}
                        checked={roomForm.amenities.includes(amenity)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRoomForm(prev => ({
                              ...prev,
                              amenities: [...prev.amenities, amenity]
                            }));
                          } else {
                            setRoomForm(prev => ({
                              ...prev,
                              amenities: prev.amenities.filter(a => a !== amenity)
                            }));
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={amenity} className="text-sm">{amenity}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Hình ảnh phòng</Label>
                <div className="mt-2">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {roomForm.images.map((image, index) => (
                      <div key={index} className="relative">
                        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-xs text-gray-500">Ảnh {index + 1}</span>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => {
                            setRoomForm(prev => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== index)
                            }));
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const imageUrl = prompt("Nhập URL hình ảnh:");
                      if (imageUrl) {
                        setRoomForm(prev => ({
                          ...prev,
                          images: [...prev.images, imageUrl]
                        }));
                      }
                    }}
                  >
                    <Plus className="mr-2" size={16} />
                    Thêm hình ảnh
                  </Button>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowRoomDialog(false)}>
                  Hủy
                </Button>
                <Button 
                  type="submit" 
                  disabled={createRoomMutation.isPending || updateRoomMutation.isPending}
                >
                  {createRoomMutation.isPending || updateRoomMutation.isPending 
                    ? "Đang lưu..." 
                    : editingRoom ? "Cập nhật" : "Thêm phòng"
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Admin Live Chat */}
      <LiveChat isAdmin={true} selectedUserId={chatUserId} />
    </div>
  );
}
