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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="bookings">Đặt phòng</TabsTrigger>
            <TabsTrigger value="chat">Tin nhắn</TabsTrigger>
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
            {stats && (stats as any).totalRooms > 0 ? (
              <div className="grid grid-cols-1 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="mr-2" size={20} />
                      Thống kê hệ thống
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Biểu đồ chi tiết sẽ hiển thị khi có đủ dữ liệu booking
                      </p>
                    </div>
                  </CardContent>
                </Card>
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
                                  booking.status === 'cancelled' ? 'destructive' :
                                  'secondary'
                                }
                              >
                                {booking.status === 'confirmed' ? 'Đã xác nhận' :
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
                              </div>
                              <div>
                                <span className="font-medium">Check-out:</span> {new Date(booking.checkOut).toLocaleDateString('vi-VN')}
                              </div>
                              <div>
                                <span className="font-medium">Khách:</span> {booking.guests}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-medium text-green-600">
                                Tổng: {parseFloat(booking.totalPrice).toLocaleString('vi-VN')}đ
                              </span>
                              <span className="text-muted-foreground">
                                Đặt ngày: {new Date(booking.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
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
                    <Card className="hover:shadow-lg transition-shadow">
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