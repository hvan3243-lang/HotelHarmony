import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Users, 
  Building, 
  Calendar,
  TrendingUp,
  DollarSign,
  Bed,
  BarChart3,
  FileText,
  MessageSquare,
  Clock,
  MessageCircle,
  CheckCircle,
  Send
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import type { Room, Service, BlogPost } from '@shared/schema';
import { AdminContactMessages } from '@/components/AdminContactMessages';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, LineElement, PointElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, LineElement, PointElement);

// Form schemas
const roomSchema = z.object({
  number: z.string().min(1, 'Số phòng là bắt buộc'),
  type: z.string().min(1, 'Loại phòng là bắt buộc'),
  price: z.string().min(1, 'Giá phòng là bắt buộc'),
  capacity: z.number().min(1, 'Sức chứa tối thiểu là 1'),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional()
});

const serviceSchema = z.object({
  name: z.string().min(1, 'Tên dịch vụ là bắt buộc'),
  description: z.string().optional(),
  price: z.string().min(1, 'Giá dịch vụ là bắt buộc'),
  category: z.string().min(1, 'Danh mục là bắt buộc'),
  isActive: z.boolean().default(true)
});

const blogSchema = z.object({
  title: z.string().min(1, 'Tiêu đề là bắt buộc'),
  content: z.string().min(1, 'Nội dung là bắt buộc'),
  excerpt: z.string().optional(),
  author: z.string().min(1, 'Tác giả là bắt buộc'),
  category: z.string().min(1, 'Danh mục là bắt buộc'),
  tags: z.array(z.string()).optional(),
  image: z.string().optional(),
  published: z.boolean().default(false)
});

type RoomForm = z.infer<typeof roomSchema>;
type ServiceForm = z.infer<typeof serviceSchema>;
type BlogForm = z.infer<typeof blogSchema>;

export default function Admin() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [blogFilter, setBlogFilter] = useState<string>('all');
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isBlogDialogOpen, setIsBlogDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null);
  
  // Chat states
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  const { data: chartData } = useQuery({
    queryKey: ['/api/admin/chart-data'],
  });

  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['/api/rooms'],
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['/api/services'],
  });

  const { data: blogPosts, isLoading: blogLoading } = useQuery({
    queryKey: ['/api/blog'],
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/bookings'],
  });

  // Chat queries
  const { data: chatConversations } = useQuery({
    queryKey: ['/api/admin/chat/conversations'],
  });

  const { data: chatMessages, isLoading: chatMessagesLoading } = useQuery({
    queryKey: ['/api/admin/chat/messages', selectedUserId],
    queryFn: selectedUserId ? async () => {
      const response = await apiRequest('GET', `/api/admin/chat/messages/${selectedUserId}`);
      return response.json();
    } : undefined,
    enabled: !!selectedUserId,
  });

  // Forms
  const roomForm = useForm<RoomForm>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      number: '',
      type: '',
      price: '',
      capacity: 1,
      description: '',
      amenities: [],
      images: []
    }
  });

  const serviceForm = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      category: '',
      isActive: true
    }
  });

  const blogForm = useForm<BlogForm>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: '',
      content: '',
      excerpt: '',
      author: '',
      category: '',
      tags: [],
      image: '',
      published: false
    }
  });

  // Mutations
  const createRoomMutation = useMutation({
    mutationFn: (data: RoomForm) => apiRequest('POST', '/api/rooms', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: 'Thành công', description: 'Phòng đã được tạo' });
      setIsRoomDialogOpen(false);
      roomForm.reset();
    }
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RoomForm }) => 
      apiRequest('PUT', `/api/rooms/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: 'Thành công', description: 'Phòng đã được cập nhật' });
      setIsRoomDialogOpen(false);
      setEditingRoom(null);
      roomForm.reset();
    }
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/rooms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: 'Thành công', description: 'Phòng đã được xóa' });
    }
  });

  const createServiceMutation = useMutation({
    mutationFn: (data: ServiceForm) => apiRequest('POST', '/api/services', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({ title: 'Thành công', description: 'Dịch vụ đã được tạo' });
      setIsServiceDialogOpen(false);
      serviceForm.reset();
    }
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ServiceForm }) => 
      apiRequest('PUT', `/api/services/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({ title: 'Thành công', description: 'Dịch vụ đã được cập nhật' });
      setIsServiceDialogOpen(false);
      setEditingService(null);
      serviceForm.reset();
    }
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({ title: 'Thành công', description: 'Dịch vụ đã được xóa' });
    }
  });

  const confirmBookingMutation = useMutation({
    mutationFn: (bookingId: number) => apiRequest('PUT', `/api/bookings/${bookingId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: 'Thành công', description: 'Đặt phòng đã được xác nhận' });
    }
  });

  const deleteBookingMutation = useMutation({
    mutationFn: (bookingId: number) => apiRequest('DELETE', `/api/bookings/${bookingId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: 'Thành công', description: 'Đặt phòng đã được xóa' });
    }
  });

  const createBlogMutation = useMutation({
    mutationFn: (data: BlogForm) => apiRequest('POST', '/api/blog', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({ title: 'Thành công', description: 'Bài viết đã được tạo' });
      setIsBlogDialogOpen(false);
      blogForm.reset();
    }
  });

  const updateBlogMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: BlogForm }) => 
      apiRequest('PUT', `/api/blog/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({ title: 'Thành công', description: 'Bài viết đã được cập nhật' });
      setIsBlogDialogOpen(false);
      setEditingBlogPost(null);
      blogForm.reset();
    }
  });

  const deleteBlogMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/blog/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      toast({ title: 'Thành công', description: 'Bài viết đã được xóa' });
    }
  });

  // Chat mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { targetUserId: number; message: string; isFromAdmin: boolean }) => 
      apiRequest('POST', '/api/chat/messages', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/messages', selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat/conversations'] });
      toast({ title: 'Thành công', description: 'Tin nhắn đã được gửi' });
    }
  });

  // Event handlers
  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    roomForm.reset({
      number: room.number,
      type: room.type,
      price: room.price,
      capacity: room.capacity,
      description: room.description || '',
      amenities: room.amenities || [],
      images: room.images || []
    });
    setIsRoomDialogOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    serviceForm.reset({
      name: service.name,
      description: service.description || '',
      price: service.price,
      category: service.category,
      isActive: service.isActive || false
    });
    setIsServiceDialogOpen(true);
  };

  const handleEditBlogPost = (blogPost: BlogPost) => {
    setEditingBlogPost(blogPost);
    blogForm.reset({
      title: blogPost.title,
      content: blogPost.content,
      excerpt: blogPost.excerpt || '',
      author: blogPost.author,
      category: blogPost.category,
      tags: blogPost.tags || [],
      image: blogPost.image || '',
      published: blogPost.published || false
    });
    setIsBlogDialogOpen(true);
  };

  const confirmBooking = (bookingId: number) => {
    confirmBookingMutation.mutate(bookingId);
  };

  const deleteBooking = (bookingId: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa đặt phòng này không?")) {
      deleteBookingMutation.mutate(bookingId);
    }
  };

  const onRoomSubmit = (data: RoomForm) => {
    if (editingRoom) {
      updateRoomMutation.mutate({ id: editingRoom.id, data });
    } else {
      createRoomMutation.mutate(data);
    }
  };

  const onServiceSubmit = (data: ServiceForm) => {
    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, data });
    } else {
      createServiceMutation.mutate(data);
    }
  };

  const onBlogSubmit = (data: BlogForm) => {
    if (editingBlogPost) {
      updateBlogMutation.mutate({ id: editingBlogPost.id, data });
    } else {
      createBlogMutation.mutate(data);
    }
  };

  // Filter data
  const filteredRooms = Array.isArray(rooms) ? (rooms as Room[]).filter((room: Room) => {
    const matchesSearch = room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = roomFilter === 'all' || room.type === roomFilter;
    return matchesSearch && matchesFilter;
  }) : [];

  const filteredServices = Array.isArray(services) ? (services as Service[]).filter((service: Service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = serviceFilter === 'all' || service.category === serviceFilter;
    return matchesSearch && matchesFilter;
  }) : [];

  const filteredBlogPosts = Array.isArray(blogPosts) ? (blogPosts as BlogPost[]).filter((post: BlogPost) => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = blogFilter === 'all' || post.category === blogFilter;
    return matchesSearch && matchesFilter;
  }) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Quản trị viên
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Quản lý khách sạn và dịch vụ
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="bookings">Đặt phòng</TabsTrigger>
            <TabsTrigger value="walkin">Walk-in</TabsTrigger>
            <TabsTrigger value="chat">Tin nhắn</TabsTrigger>
            <TabsTrigger value="contact">Liên hệ</TabsTrigger>
            <TabsTrigger value="rooms">Phòng</TabsTrigger>
            <TabsTrigger value="services">Dịch vụ</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Tổng phòng</p>
                        <p className="text-3xl font-bold">{(stats as any)?.totalRooms || 0}</p>
                      </div>
                      <Building className="h-8 w-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">Đã đặt</p>
                        <p className="text-3xl font-bold">{(stats as any)?.totalBookings || 0}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">Khách hàng</p>
                        <p className="text-3xl font-bold">{(stats as any)?.totalCustomers || 0}</p>
                      </div>
                      <Users className="h-8 w-8 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm font-medium">Doanh thu</p>
                        <p className="text-3xl font-bold">{(stats as any)?.totalRevenue || 0}₫</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts Section */}
            {chartData && stats && (stats as any).totalRooms > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BarChart3 className="mr-2" size={20} />
                        Doanh thu theo tháng
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <Bar
                          data={{
                            labels: (chartData as any)?.monthlyRevenue?.map((item: any) => item.month) || [],
                            datasets: [{
                              label: 'Doanh thu (VNĐ)',
                              data: (chartData as any)?.monthlyRevenue?.map((item: any) => item.revenue) || [],
                              backgroundColor: 'rgba(59, 130, 246, 0.6)',
                              borderColor: 'rgba(59, 130, 246, 1)',
                              borderWidth: 1,
                              borderRadius: 8,
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  callback: function(value) {
                                    return new Intl.NumberFormat('vi-VN').format(value as number) + 'đ';
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Room Distribution Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Bed className="mr-2" size={20} />
                        Phân bố loại phòng
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] flex items-center justify-center">
                        <Doughnut
                          data={{
                            labels: (chartData as any)?.roomDistribution?.map((item: any) => {
                              const typeNames: Record<string, string> = {
                                'standard': 'Tiêu chuẩn',
                                'deluxe': 'Deluxe',
                                'suite': 'Suite',
                                'presidential': 'Tổng thống'
                              };
                              return typeNames[item.type] || item.type;
                            }) || [],
                            datasets: [{
                              data: (chartData as any)?.roomDistribution?.map((item: any) => item.count) || [],
                              backgroundColor: [
                                'rgba(59, 130, 246, 0.8)',
                                'rgba(16, 185, 129, 0.8)',
                                'rgba(245, 158, 11, 0.8)',
                                'rgba(239, 68, 68, 0.8)',
                              ],
                              borderWidth: 2,
                              borderColor: '#ffffff'
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'bottom',
                                labels: {
                                  padding: 20,
                                  usePointStyle: true
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Booking Status Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="lg:col-span-2"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="mr-2" size={20} />
                        Trạng thái đặt phòng
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <Line
                          data={{
                            labels: (chartData as any)?.bookingStatus?.map((item: any) => {
                              const statusNames: Record<string, string> = {
                                'pending': 'Chờ xác nhận',
                                'deposit_paid': 'Đã đặt cọc',
                                'confirmed': 'Đã xác nhận',
                                'completed': 'Hoàn thành',
                                'cancelled': 'Đã hủy'
                              };
                              return statusNames[item.status] || item.status;
                            }) || [],
                            datasets: [{
                              label: 'Số lượng đặt phòng',
                              data: (chartData as any)?.bookingStatus?.map((item: any) => item.count) || [],
                              borderColor: 'rgba(34, 197, 94, 1)',
                              backgroundColor: 'rgba(34, 197, 94, 0.1)',
                              tension: 0.4,
                              fill: true,
                              pointBackgroundColor: 'rgba(34, 197, 94, 1)',
                              pointBorderColor: '#ffffff',
                              pointBorderWidth: 2,
                              pointRadius: 6
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  stepSize: 1
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Card className="max-w-md mx-auto">
                  <CardContent className="p-8">
                    <BarChart3 className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <h3 className="text-lg font-semibold mb-2">Chưa có dữ liệu</h3>
                    <p className="text-muted-foreground">
                      Thêm phòng và bookings để xem biểu đồ thống kê
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Quản lý đặt phòng</h2>
            </div>

            {/* Payment Statistics */}
            {(bookings as any[])?.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {(bookings as any[]).filter((b: any) => b.status === 'pending').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Chờ thanh toán</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {(bookings as any[]).filter((b: any) => b.status === 'deposit_paid').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Đã đặt cọc</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {(bookings as any[]).filter((b: any) => b.status === 'confirmed').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Đã xác nhận</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-800">
                        {(bookings as any[])
                          .filter((b: any) => b.status === 'confirmed' || b.status === 'completed')
                          .reduce((sum: number, b: any) => sum + parseFloat(b.totalPrice), 0)
                          .toLocaleString('vi-VN')}đ
                      </div>
                      <div className="text-sm text-muted-foreground">Doanh thu</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {bookingsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center">
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-32"></div>
                          <div className="h-3 bg-muted rounded w-48"></div>
                        </div>
                        <div className="h-6 bg-muted rounded w-16"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (bookings as any[])?.length > 0 ? (
              <div className="space-y-4">
                {(bookings as any[]).map((booking: any) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-4">
                              <h3 className="text-lg font-semibold">
                                #{booking.id} - {booking.user?.firstName} {booking.user?.lastName}
                              </h3>
                              <Badge 
                                variant={
                                  booking.status === 'confirmed' ? 'default' :
                                  booking.status === 'deposit_paid' ? 'secondary' :
                                  booking.status === 'cancelled' ? 'destructive' :
                                  'outline'
                                }
                              >
                                {booking.status === 'confirmed' ? 'Đã xác nhận' :
                                 booking.status === 'deposit_paid' ? 'Đã đặt cọc' :
                                 booking.status === 'cancelled' ? 'Đã hủy' :
                                 booking.status === 'pending' ? 'Chờ xác nhận' : booking.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">Phòng:</span> {booking.room?.type} - {booking.room?.number}
                              </div>
                              <div>
                                <span className="font-medium">Check-in:</span> {new Date(booking.checkIn).toLocaleDateString('vi-VN')}
                                {booking.checkInTime && <span className="ml-2 text-muted-foreground">({booking.checkInTime})</span>}
                              </div>
                              <div>
                                <span className="font-medium">Check-out:</span> {new Date(booking.checkOut).toLocaleDateString('vi-VN')}
                                {booking.checkOutTime && <span className="ml-2 text-muted-foreground">({booking.checkOutTime})</span>}
                              </div>
                              <div>
                                <span className="font-medium">Khách:</span> {booking.guests}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-4 text-sm">
                                <span className="font-medium text-green-600">
                                  Tổng: {parseFloat(booking.totalPrice).toLocaleString('vi-VN')}đ
                                </span>
                                <span className="text-muted-foreground">
                                  Đặt ngày: {new Date(booking.createdAt).toLocaleDateString('vi-VN')}
                                </span>
                              </div>
                              
                              {/* Payment Status */}
                              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div className="text-sm font-medium mb-2 text-gray-800">Trạng thái thanh toán:</div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  {booking.status === 'pending' && (
                                    <div className="text-orange-600">
                                      <span className="font-medium">Chưa thanh toán:</span> 0đ / {parseFloat(booking.totalPrice).toLocaleString('vi-VN')}đ
                                    </div>
                                  )}
                                  {booking.status === 'deposit_paid' && (
                                    <>
                                      <div className="text-green-600">
                                        <span className="font-medium">Đã đặt cọc (30%):</span> {(parseFloat(booking.totalPrice) * 0.3).toLocaleString('vi-VN')}đ
                                      </div>
                                      <div className="text-orange-600">
                                        <span className="font-medium">Còn lại:</span> {(parseFloat(booking.totalPrice) * 0.7).toLocaleString('vi-VN')}đ
                                      </div>
                                    </>
                                  )}
                                  {booking.status === 'confirmed' && (
                                    <div className="text-green-600">
                                      <span className="font-medium">Đã thanh toán đầy đủ:</span> {parseFloat(booking.totalPrice).toLocaleString('vi-VN')}đ
                                    </div>
                                  )}
                                  {booking.status === 'completed' && (
                                    <div className="text-blue-600">
                                      <span className="font-medium">Hoàn thành:</span> {parseFloat(booking.totalPrice).toLocaleString('vi-VN')}đ
                                    </div>
                                  )}
                                  <div className="text-slate-600">
                                    <span className="font-medium">Phương thức:</span> {
                                      booking.paymentMethod === 'stripe' ? 'Thẻ tín dụng' :
                                      booking.paymentMethod === 'cash_on_arrival' ? 'Tiền mặt' :
                                      booking.paymentMethod === 'e_wallet' ? 'Ví điện tử' :
                                      booking.paymentMethod || 'Chưa xác định'
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {booking.status === 'pending' && (
                              <>
                                <Badge variant="outline" className="text-orange-600 border-orange-300">
                                  ⚠️ Chưa thanh toán
                                </Badge>
                                <Button
                                  size="sm"
                                  onClick={() => confirmBooking(booking.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                  disabled
                                  title="Khách hàng cần thanh toán trước khi xác nhận"
                                >
                                  <CheckCircle className="mr-1 h-4 w-4" />
                                  Chờ thanh toán
                                </Button>
                              </>
                            )}
                            {booking.status === 'deposit_paid' && (
                              <>
                                <Badge variant="secondary" className="text-green-600">
                                  ✅ Đã đặt cọc
                                </Badge>
                                <Button
                                  size="sm"
                                  onClick={() => confirmBooking(booking.id)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <CheckCircle className="mr-1 h-4 w-4" />
                                  Xác nhận nhận phòng
                                </Button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <Badge variant="default" className="bg-green-600">
                                ✅ Đã xác nhận
                              </Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(`HLX${booking.id}`);
                                toast({
                                  title: "Đã sao chép",
                                  description: `Mã đặt phòng HLX${booking.id}`,
                                });
                              }}
                            >
                              Sao chép mã
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteBooking(booking.id)}
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              Xóa
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <h3 className="text-lg font-semibold mb-2">Chưa có đặt phòng nào</h3>
                  <p className="text-muted-foreground">
                    Các đặt phòng mới sẽ hiển thị ở đây
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Quản lý tin nhắn</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chat List */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Danh sách khách hàng</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {(chatConversations as any[])?.map((conversation: any) => (
                        <div
                          key={conversation.userId}
                          className={`p-4 cursor-pointer hover:bg-muted transition-colors border-b ${
                            selectedUserId === conversation.userId ? 'bg-muted' : ''
                          }`}
                          onClick={() => setSelectedUserId(conversation.userId)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">
                                {conversation.userName} {conversation.userLastName}
                              </h4>
                              <p className="text-sm text-muted-foreground truncate">
                                {conversation.lastMessage}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                {new Date(conversation.lastMessageTime).toLocaleDateString('vi-VN')}
                              </p>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!(chatConversations as any[]) || (chatConversations as any[])?.length === 0) && (
                        <div className="p-8 text-center text-muted-foreground">
                          <MessageCircle className="mx-auto mb-2" size={32} />
                          <p>Chưa có tin nhắn nào</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chat Messages */}
              <div className="lg:col-span-2">
                {selectedUserId ? (
                  <Card className="h-[600px] flex flex-col">
                    <CardHeader className="border-b">
                      <CardTitle className="text-lg">
                        {(() => {
                          const conversation = (chatConversations as any[])?.find(c => c.userId === selectedUserId);
                          return conversation ? 
                            `Trò chuyện với ${conversation.userName} ${conversation.userLastName}` : 
                            `Trò chuyện với khách hàng #${selectedUserId}`;
                        })()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 flex flex-col">
                      {/* Messages */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {(chatMessages as any[])?.map((message: any, index: number) => (
                          <div
                            key={message.id}
                            className={`flex ${message.isFromAdmin ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] p-3 rounded-lg ${
                                message.isFromAdmin
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-xs font-medium mb-1 opacity-80">
                                {message.senderName || (message.isFromAdmin ? 'Admin' : 'Khách hàng')}
                              </p>
                              <p className="text-sm">{message.message}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(message.createdAt).toLocaleString('vi-VN')}
                              </p>
                            </div>
                          </div>
                        ))}
                        {chatMessagesLoading && (
                          <div className="flex justify-center">
                            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                          </div>
                        )}
                      </div>

                      {/* Message Input */}
                      <div className="border-t p-4">
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (newMessage.trim() && selectedUserId) {
                              sendMessageMutation.mutate({
                                targetUserId: selectedUserId,
                                message: newMessage,
                                isFromAdmin: true
                              });
                              setNewMessage('');
                            }
                          }}
                          className="flex gap-2"
                        >
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Nhập tin nhắn..."
                            className="flex-1"
                          />
                          <Button 
                            type="submit" 
                            disabled={!newMessage.trim() || sendMessageMutation.isPending}
                          >
                            <Send size={16} />
                          </Button>
                        </form>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-[600px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MessageCircle className="mx-auto mb-4" size={48} />
                      <h3 className="text-lg font-semibold mb-2">Chọn khách hàng</h3>
                      <p>Chọn một khách hàng từ danh sách để bắt đầu trò chuyện</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Contact Messages Tab */}
          <TabsContent value="contact" className="mt-6">
            <AdminContactMessages />
          </TabsContent>

          {/* Walk-in Tab */}
          <TabsContent value="walkin" className="mt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Đặt phòng Walk-in</h2>
              <p className="text-muted-foreground">
                Xử lý đặt phòng cho khách hàng đến trực tiếp tại khách sạn
              </p>
            </div>

            <Card>
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Bắt đầu đặt phòng Walk-in</h3>
                    <p className="text-muted-foreground mb-6">
                      Nhấn nút bên dưới để bắt đầu quy trình đặt phòng cho khách hàng đến trực tiếp
                    </p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Quy trình Walk-in:</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>1. 📋 Nhập thông tin khách hàng</p>
                      <p>2. 🏨 Chọn phòng trống phù hợp</p>
                      <p>3. 💳 Thu tiền và xác nhận (100% thanh toán)</p>
                      <p>4. ✅ Khách nhận phòng ngay</p>
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => window.open('/walkin-booking', '_blank')}
                  >
                    <Users className="mr-2" size={20} />
                    Bắt đầu đặt phòng Walk-in
                  </Button>
                </div>
              </CardContent>
            </Card>
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
                <Select value={roomFilter} onValueChange={setRoomFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Lọc theo loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="deluxe">Deluxe</SelectItem>
                    <SelectItem value="suite">Suite</SelectItem>
                    <SelectItem value="presidential">Presidential</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingRoom(null);
                    roomForm.reset();
                  }}>
                    <Plus className="mr-2" size={16} />
                    Thêm phòng
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingRoom ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...roomForm}>
                    <form onSubmit={roomForm.handleSubmit(onRoomSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={roomForm.control}
                          name="number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Số phòng</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="101" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={roomForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Loại phòng</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Chọn loại phòng" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="standard">Standard</SelectItem>
                                  <SelectItem value="deluxe">Deluxe</SelectItem>
                                  <SelectItem value="suite">Suite</SelectItem>
                                  <SelectItem value="presidential">Presidential</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={roomForm.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Giá (VND)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="1000000" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={roomForm.control}
                          name="capacity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sức chứa</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="number" 
                                  placeholder="2"
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Image Upload Section */}
                      <FormField
                        control={roomForm.control}
                        name="images"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hình ảnh phòng</FormLabel>
                            <FormControl>
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-2">
                                  {field.value?.map((image: string, index: number) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <Input
                                        value={image}
                                        onChange={(e) => {
                                          const newImages = [...(field.value || [])];
                                          newImages[index] = e.target.value;
                                          field.onChange(newImages);
                                        }}
                                        placeholder="URL hình ảnh (ví dụ: https://images.unsplash.com/...)"
                                        className="flex-1"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const newImages = field.value?.filter((_: string, i: number) => i !== index) || [];
                                          field.onChange(newImages);
                                        }}
                                      >
                                        <Trash2 size={14} />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentImages = field.value || [];
                                    field.onChange([...currentImages, ""]);
                                  }}
                                >
                                  <Plus size={14} className="mr-2" />
                                  Thêm ảnh
                                </Button>
                                <div className="text-sm text-muted-foreground">
                                  <p>Gợi ý: Sử dụng ảnh từ Unsplash.com cho chất lượng tốt</p>
                                  <p>Ví dụ: https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80</p>
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={roomForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mô tả</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Mô tả chi tiết về phòng..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsRoomDialogOpen(false)}>
                          Hủy
                        </Button>
                        <Button type="submit" disabled={createRoomMutation.isPending || updateRoomMutation.isPending}>
                          {editingRoom ? 'Cập nhật' : 'Thêm'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roomsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                      <div className="h-8 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                filteredRooms?.map((room: Room) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
                      {/* Room Image Preview */}
                      {room.images && room.images.length > 0 && (
                        <div className="h-48 relative overflow-hidden">
                          <img
                            src={room.images[0]}
                            alt={`Phòng ${room.number}`}
                            className="w-full h-full object-cover transition-transform hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                          {room.images.length > 1 && (
                            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                              +{room.images.length - 1} ảnh
                            </div>
                          )}
                        </div>
                      )}
                      
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">Phòng {room.number}</h3>
                            <Badge variant="secondary" className="mt-1">
                              {room.type}
                            </Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditRoom(room)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteRoomMutation.mutate(room.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Giá: {room.price} VND/đêm
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Sức chứa: {room.capacity} người
                          </p>
                          {room.description && (
                            <p className="text-sm text-muted-foreground">
                              {room.description}
                            </p>
                          )}
                          {room.images && room.images.length > 0 && (
                            <p className="text-xs text-green-600 font-medium">
                              ✓ {room.images.length} hình ảnh
                            </p>
                          )}
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
                <Select value={serviceFilter} onValueChange={setServiceFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Lọc theo danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="spa">Spa</SelectItem>
                    <SelectItem value="restaurant">Nhà hàng</SelectItem>
                    <SelectItem value="fitness">Gym</SelectItem>
                    <SelectItem value="entertainment">Giải trí</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingService(null);
                    serviceForm.reset();
                  }}>
                    <Plus className="mr-2" size={16} />
                    Thêm dịch vụ
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...serviceForm}>
                    <form onSubmit={serviceForm.handleSubmit(onServiceSubmit)} className="space-y-4">
                      <FormField
                        control={serviceForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tên dịch vụ</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Massage thư giãn" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={serviceForm.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Giá (VND)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="500000" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={serviceForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Danh mục</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Chọn danh mục" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="spa">Spa</SelectItem>
                                  <SelectItem value="restaurant">Nhà hàng</SelectItem>
                                  <SelectItem value="fitness">Gym</SelectItem>
                                  <SelectItem value="entertainment">Giải trí</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={serviceForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mô tả</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Mô tả chi tiết về dịch vụ..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsServiceDialogOpen(false)}>
                          Hủy
                        </Button>
                        <Button type="submit" disabled={createServiceMutation.isPending || updateServiceMutation.isPending}>
                          {editingService ? 'Cập nhật' : 'Thêm'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servicesLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                      <div className="h-8 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                filteredServices?.map((service: Service) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{service.name}</h3>
                            <Badge variant="secondary" className="mt-1">
                              {service.category}
                            </Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditService(service)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteServiceMutation.mutate(service.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Giá: {service.price} VND
                          </p>
                          {service.description && (
                            <p className="text-sm text-muted-foreground">
                              {service.description}
                            </p>
                          )}
                          <Badge variant={service.isActive ? "default" : "secondary"}>
                            {service.isActive ? "Hoạt động" : "Tạm dừng"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Blog Tab */}
          <TabsContent value="blog" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    placeholder="Tìm kiếm bài viết..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={blogFilter} onValueChange={setBlogFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Lọc theo danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="news">Tin tức</SelectItem>
                    <SelectItem value="travel">Du lịch</SelectItem>
                    <SelectItem value="tips">Mẹo hay</SelectItem>
                    <SelectItem value="promotion">Khuyến mãi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Dialog open={isBlogDialogOpen} onOpenChange={setIsBlogDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingBlogPost(null);
                    blogForm.reset();
                  }}>
                    <Plus className="mr-2" size={16} />
                    Thêm bài viết
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingBlogPost ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...blogForm}>
                    <form onSubmit={blogForm.handleSubmit(onBlogSubmit)} className="space-y-4">
                      <FormField
                        control={blogForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tiêu đề</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Tiêu đề bài viết..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={blogForm.control}
                          name="author"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tác giả</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Tên tác giả" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={blogForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Danh mục</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Chọn danh mục" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="news">Tin tức</SelectItem>
                                  <SelectItem value="travel">Du lịch</SelectItem>
                                  <SelectItem value="tips">Mẹo hay</SelectItem>
                                  <SelectItem value="promotion">Khuyến mãi</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={blogForm.control}
                        name="excerpt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tóm tắt</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Tóm tắt ngắn gọn..." rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={blogForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nội dung</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Nội dung chi tiết..." rows={8} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={blogForm.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hình ảnh (URL)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://example.com/image.jpg" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={blogForm.control}
                        name="published"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Xuất bản</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Bài viết sẽ hiển thị trên trang blog công khai
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsBlogDialogOpen(false)}>
                          Hủy
                        </Button>
                        <Button type="submit" disabled={createBlogMutation.isPending || updateBlogMutation.isPending}>
                          {editingBlogPost ? 'Cập nhật' : 'Thêm'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                      <div className="h-8 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                filteredBlogPosts?.map((post: BlogPost) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold line-clamp-2">{post.title}</h3>
                            <Badge variant="secondary" className="mt-1">
                              {post.category}
                            </Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditBlogPost(post)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteBlogMutation.mutate(post.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Tác giả: {post.author}
                          </p>
                          {post.excerpt && (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {post.excerpt}
                            </p>
                          )}
                          <Badge variant={post.published ? "default" : "secondary"}>
                            {post.published ? "Đã xuất bản" : "Nháp"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}