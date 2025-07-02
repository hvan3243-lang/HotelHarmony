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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  MessageCircle,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Room, Service } from "@shared/schema";
import { useEffect } from "react";
import { LiveChat } from "@/components/LiveChat";
import { AdminNotifications } from "@/components/AdminNotifications";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [chatUserId, setChatUserId] = useState<number | null>(null);

  // Room form state
  const [roomForm, setRoomForm] = useState({
    number: "",
    type: "",
    price: "",
    capacity: "",
    description: "",
    amenities: [] as string[],
    images: [] as string[],
    status: "available"
  });

  // Service form state
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    isActive: true
  });

  // Check if user is admin
  useEffect(() => {
    if (!authManager.isAuthenticated() || !authManager.isAdmin()) {
      setLocation("/auth");
      return;
    }

    // Check for chat user ID from URL
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('chatUserId');
    if (userId) {
      setChatUserId(parseInt(userId));
    }
  }, [setLocation]);

  // Queries
  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ["/api/rooms"],
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/services"],
  });

  // Mutations
  const createRoomMutation = useMutation({
    mutationFn: (roomData: any) => apiRequest("POST", "/api/rooms", roomData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowRoomDialog(false);
      resetRoomForm();
      toast({
        title: "Thành công",
        description: "Đã thêm phòng mới",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm phòng",
        variant: "destructive",
      });
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/api/rooms/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      setShowRoomDialog(false);
      resetRoomForm();
      setEditingRoom(null);
      toast({
        title: "Thành công",
        description: "Đã cập nhật phòng",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật phòng",
        variant: "destructive",
      });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/rooms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "Thành công",
        description: "Đã xóa phòng",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa phòng",
        variant: "destructive",
      });
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: (serviceData: any) => apiRequest("POST", "/api/services", serviceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setShowServiceDialog(false);
      resetServiceForm();
      toast({
        title: "Thành công",
        description: "Đã thêm dịch vụ mới",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể thêm dịch vụ",
        variant: "destructive",
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest("PUT", `/api/services/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setShowServiceDialog(false);
      resetServiceForm();
      setEditingService(null);
      toast({
        title: "Thành công",
        description: "Đã cập nhật dịch vụ",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật dịch vụ",
        variant: "destructive",
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "Thành công",
        description: "Đã xóa dịch vụ",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa dịch vụ",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const resetRoomForm = () => {
    setRoomForm({
      number: "",
      type: "",
      price: "",
      capacity: "",
      description: "",
      amenities: [],
      images: [],
      status: "available"
    });
  };

  const resetServiceForm = () => {
    setServiceForm({
      name: "",
      description: "",
      price: "",
      category: "",
      isActive: true
    });
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomForm({
      number: room.number,
      type: room.type,
      price: room.price,
      capacity: room.capacity.toString(),
      description: room.description || "",
      amenities: room.amenities || [],
      images: room.images || [],
      status: room.status
    });
    setShowRoomDialog(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description || "",
      price: service.price,
      category: service.category,
      isActive: service.isActive ?? true
    });
    setShowServiceDialog(true);
  };

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const roomData = {
      ...roomForm,
      price: roomForm.price,
      capacity: parseInt(roomForm.capacity),
    };

    if (editingRoom) {
      updateRoomMutation.mutate({ id: editingRoom.id, ...roomData });
    } else {
      createRoomMutation.mutate(roomData);
    }
  };

  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const serviceData = {
      ...serviceForm,
      price: serviceForm.price,
    };

    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, ...serviceData });
    } else {
      createServiceMutation.mutate(serviceData);
    }
  };

  const filteredRooms = (rooms as Room[]).filter((room) => {
    if (!searchTerm) return true;
    return (
      room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredServices = (services as Service[]).filter((service) => {
    if (!searchTerm) return true;
    return (
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

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
    };
    return variants[status] || { variant: "secondary", label: status, icon: Clock };
  };

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
            <p className="text-muted-foreground mt-2">Hệ thống quản lý khách sạn</p>
          </div>
          <div className="flex space-x-4 items-center">
            <AdminNotifications />
            <Button onClick={() => setLocation("/")}>
              Về trang chủ
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
            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <MessageCircle className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-100">
                      ✅ Đang trò chuyện với khách hàng #{chatUserId}
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Chat đã được mở sẵn với khách hàng này. Nhấn biểu tượng chat góc dưới để trả lời ngay!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 size={16} />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <Bed size={16} />
              Quản lý phòng
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Settings size={16} />
              Quản lý dịch vụ
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-6">
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
                    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100">Tổng số phòng</p>
                            <p className="text-3xl font-bold">{(stats as any).totalRooms || 0}</p>
                          </div>
                          <Bed className="h-12 w-12 text-blue-200" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-100">Tỷ lệ lấp đầy</p>
                            <p className="text-3xl font-bold">{Math.round(((stats as any).occupancyRate || 0) * 100)}%</p>
                          </div>
                          <TrendingUp className="h-12 w-12 text-green-200" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-100">Tổng khách hàng</p>
                            <p className="text-3xl font-bold">{(stats as any).totalCustomers || 0}</p>
                          </div>
                          <Users className="h-12 w-12 text-purple-200" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-orange-100">Doanh thu</p>
                            <p className="text-3xl font-bold">{((stats as any).totalRevenue || 0).toLocaleString()}đ</p>
                          </div>
                          <DollarSign className="h-12 w-12 text-orange-200" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </>
              )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="xl:col-span-2"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="mr-2" size={20} />
                      Doanh Thu Theo Tháng
                    </CardTitle>
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

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="mr-2" size={20} />
                      Hoạt động gần đây
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center text-muted-foreground py-8">
                        <Clock className="mx-auto mb-2" size={32} />
                        <p>Chưa có hoạt động nào</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Rooms Tab */}
          <TabsContent value="rooms" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    placeholder="Tìm kiếm phòng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
              <Button onClick={() => setShowRoomDialog(true)}>
                <Plus className="mr-2" size={16} />
                Thêm phòng
              </Button>
            </div>

            {/* Rooms List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {roomsLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-32 bg-muted rounded mb-4"></div>
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-4 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                filteredRooms.map((room: Room) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">Phòng {room.number}</h3>
                            <p className="text-sm text-muted-foreground">{getRoomTypeLabel(room.type)}</p>
                          </div>
                          <Badge variant={getStatusBadge(room.status).variant}>
                            {getStatusBadge(room.status).label}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span>Giá:</span>
                            <span className="font-medium">{room.price}đ/đêm</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Sức chứa:</span>
                            <span>{room.capacity} người</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRoom(room)}
                            className="flex-1"
                          >
                            <Edit size={14} className="mr-1" />
                            Sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteRoomMutation.mutate(room.id)}
                            disabled={deleteRoomMutation.isPending}
                            className="flex-1"
                          >
                            <Trash2 size={14} className="mr-1" />
                            Xóa
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    placeholder="Tìm kiếm dịch vụ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
              <Button onClick={() => setShowServiceDialog(true)}>
                <Plus className="mr-2" size={16} />
                Thêm dịch vụ
              </Button>
            </div>

            {/* Services List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servicesLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-16 bg-muted rounded mb-4"></div>
                      <div className="h-4 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                filteredServices.map((service: Service) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{service.name}</h3>
                            <p className="text-sm text-muted-foreground">{service.category}</p>
                          </div>
                          <Badge variant={service.isActive ? "default" : "secondary"}>
                            {service.isActive ? "Hoạt động" : "Tạm dừng"}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                          {service.description}
                        </p>

                        <div className="flex justify-between items-center mb-4">
                          <span className="text-lg font-semibold text-primary">{service.price}đ</span>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditService(service)}
                            className="flex-1"
                          >
                            <Edit size={14} className="mr-1" />
                            Sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteServiceMutation.mutate(service.id)}
                            disabled={deleteServiceMutation.isPending}
                            className="flex-1"
                          >
                            <Trash2 size={14} className="mr-1" />
                            Xóa
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Room Dialog */}
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
                    onChange={(e) => setRoomForm({ ...roomForm, number: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Loại phòng</Label>
                  <Select value={roomForm.type} onValueChange={(value) => setRoomForm({ ...roomForm, type: value })}>
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
                  <Label htmlFor="price">Giá (VND)</Label>
                  <Input
                    id="price"
                    value={roomForm.price}
                    onChange={(e) => setRoomForm({ ...roomForm, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Sức chứa</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={roomForm.description}
                  onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="status">Trạng thái</Label>
                <Select value={roomForm.status} onValueChange={(value) => setRoomForm({ ...roomForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Trống</SelectItem>
                    <SelectItem value="booked">Đã đặt</SelectItem>
                    <SelectItem value="maintenance">Bảo trì</SelectItem>
                  </SelectContent>
                </Select>
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

        {/* Service Dialog */}
        <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleServiceSubmit} className="space-y-4">
              <div>
                <Label htmlFor="service-name">Tên dịch vụ</Label>
                <Input
                  id="service-name"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service-category">Danh mục</Label>
                  <Input
                    id="service-category"
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="service-price">Giá (VND)</Label>
                  <Input
                    id="service-price"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="service-description">Mô tả</Label>
                <Textarea
                  id="service-description"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="service-active"
                  checked={serviceForm.isActive}
                  onChange={(e) => setServiceForm({ ...serviceForm, isActive: e.target.checked })}
                />
                <Label htmlFor="service-active">Kích hoạt dịch vụ</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowServiceDialog(false)}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
                >
                  {createServiceMutation.isPending || updateServiceMutation.isPending 
                    ? "Đang lưu..." 
                    : editingService ? "Cập nhật" : "Thêm dịch vụ"
                  }
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Admin Live Chat */}
      <LiveChat isAdmin={true} selectedUserId={chatUserId || undefined} />
    </div>
  );
}