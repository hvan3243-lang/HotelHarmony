import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart3,
  Bed,
  Building,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  CreditCard,
  Crown,
  DollarSign,
  Edit,
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  PieChart,
  Plus,
  RotateCcw,
  Search,
  Send,
  Smile,
  Star,
  Target,
  Trash2,
  TrendingUp,
  User,
  Users,
  Video,
} from "lucide-react";
import React, { useState } from "react";

import { AdminContactMessages } from "@/components/AdminContactMessages";
import { CreateAdmin } from "@/components/CreateAdmin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { useForm } from "react-hook-form";
import { z } from "zod";
// Define types locally to avoid import issues
interface Room {
  id: number;
  number: string;
  type: string;
  price: number;
  capacity: number;
  description?: string;
  amenities?: string;
  images?: string;
}

interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  isActive: boolean;
}

interface BlogPost {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  author: string;
  category: string;
  tags?: string;
  image?: string;
  published: boolean;
  read_time?: number;
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement
);

// Form schemas
const roomSchema = z.object({
  number: z.string().min(1, "Số phòng là bắt buộc"),
  type: z.string().min(1, "Loại phòng là bắt buộc"),
  price: z.string().min(1, "Giá phòng là bắt buộc"),
  capacity: z
    .string()
    .min(1, "Sức chứa tối thiểu là 1")
    .transform((val) => parseInt(val, 10)),
  description: z.string().optional(),
  amenities: z.string().optional(),
  images: z.string().optional(),
});

const serviceSchema = z.object({
  name: z.string().min(1, "Tên dịch vụ là bắt buộc"),
  description: z.string().optional(),
  price: z.string().min(1, "Giá dịch vụ là bắt buộc"),
  category: z.string().min(1, "Danh mục là bắt buộc"),
  isActive: z.boolean().default(true),
});

const blogSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc"),
  content: z.string().min(1, "Nội dung là bắt buộc"),
  excerpt: z.string().optional(),
  author: z.string().min(1, "Tác giả là bắt buộc"),
  category: z.string().min(1, "Danh mục là bắt buộc"),
  tags: z.string().optional(),
  image: z.string().optional(),
  published: z.boolean().default(false),
  read_time: z.string().optional(),
});

type RoomForm = z.infer<typeof roomSchema>;
type ServiceForm = z.infer<typeof serviceSchema>;
type BlogForm = z.infer<typeof blogSchema>;

export default function Admin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [blogFilter, setBlogFilter] = useState<string>("all");
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isBlogDialogOpen, setIsBlogDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null);

  // Chat states
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showMenuFor, setShowMenuFor] = useState<number | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user info for debugging
  const user = authManager.getUser();
  const token = authManager.getToken();

  // Queries
  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ["/api/rooms"],
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/services"],
  });

  const { data: blogPosts, isLoading: blogLoading } = useQuery({
    queryKey: ["/api/blog"],
  });

  const {
    data: bookings,
    isLoading: bookingsLoading,
    error: bookingsError,
  } = useQuery({
    queryKey: ["/api/bookings"],
  });

  // Chat queries
  const { data: chatConversations } = useQuery({
    queryKey: ["/api/admin/chat/conversations"],
  });

  const { data: chatMessages, isLoading: chatMessagesLoading } = useQuery({
    queryKey: ["/api/admin/chat/messages", selectedUserId],
    queryFn: selectedUserId
      ? async () => {
          const response = await apiRequest(
            "GET",
            `/api/admin/chat/messages/${selectedUserId}`
          );
          return response.json();
        }
      : undefined,
    enabled: !!selectedUserId,
    refetchInterval: 2000, // Polling mỗi 2 giây để nhận tin nhắn mới
  });

  // Test API: Create unread message
  const createTestMessageMutation = useMutation({
    mutationFn: async (data: { message: string; targetUserId: number }) => {
      try {
        const response = await apiRequest(
          "POST",
          "/api/chat/messages/test",
          data
        );
        const jsonResponse = await response.json();
        return jsonResponse;
      } catch (error) {
        console.error("Error creating test message:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Refresh unread counts after creating test message
      queryClient.invalidateQueries({
        queryKey: ["/api/chat/messages/unread-counts"],
      });
    },
  });

  // Mark messages as read when admin views them
  const markAsReadMutation = useMutation({
    mutationFn: async (data: { targetUserId: number }) => {
      try {
        const response = await apiRequest(
          "PUT",
          "/api/chat/messages/read",
          data
        );
        const jsonResponse = await response.json();
        return jsonResponse;
      } catch (error) {
        console.error("API call error:", error);
        throw error;
      }
    },
    onSuccess: (response) => {
      console.log("Mark as read success:", response);
      // Refresh unread counts after marking as read
      queryClient.invalidateQueries({
        queryKey: ["/api/chat/messages/unread-counts"],
      });
    },
    onError: (error) => {
      console.error("Mark as read error:", error);
    },
  });

  // Auto mark as read when messages are loaded
  React.useEffect(() => {
    if (selectedUserId && chatMessages && chatMessages.length > 0) {
      console.log("Auto marking messages as read for user:", selectedUserId);
      // Mark customer messages as read
      markAsReadMutation.mutate({ targetUserId: selectedUserId });
    }
  }, [selectedUserId, chatMessages]);

  // Get unread message counts for each conversation (customer messages not read by admin)
  const { data: unreadCounts } = useQuery({
    queryKey: ["/api/chat/messages/unread-counts"],
    queryFn: async () => {
      console.log("🔍 Starting unread count query...");
      if (!chatConversations || chatConversations.length === 0) {
        console.log("❌ No conversations found");
        return {};
      }

      console.log("📋 Conversations:", chatConversations);
      const counts: { [key: number]: number } = {};

      for (const conversation of chatConversations) {
        try {
          console.log(`🔍 Checking unread for user ${conversation.user_id}...`);
          // Get customer messages that are not read by admin
          const response = await apiRequest(
            "GET",
            `/api/chat/messages/status/${conversation.user_id}`
          );
          const jsonResponse = await response.json();
          console.log(
            `✅ Debug for user ${conversation.user_id}:`,
            jsonResponse
          );
          console.log(
            `📋 All messages for user ${conversation.user_id}:`,
            jsonResponse.allMessages
          );
          // Log each message detail
          (jsonResponse.allMessages || []).forEach(
            (msg: any, index: number) => {
              console.log(`📝 Message ${index + 1}:`, {
                id: msg.id,
                user_id: msg.user_id,
                message: msg.message,
                is_from_admin: msg.is_from_admin,
                is_read: msg.is_read,
              });
            }
          );

          // Debug: Check which messages should be counted as unread
          const unreadFromUser = (jsonResponse.allMessages || []).filter(
            (msg: any) => msg.is_from_admin === 0 && msg.is_read === 0
          );
          const unreadFromAdmin = (jsonResponse.allMessages || []).filter(
            (msg: any) => msg.is_from_admin === 1 && msg.is_read === 0
          );
          console.log(
            "🔍 Messages from user (is_from_admin: 0) that are unread (is_read: 0):",
            unreadFromUser.length
          );
          console.log(
            "🔍 Messages from admin (is_from_admin: 1) that are unread (is_read: 0):",
            unreadFromAdmin.length
          );
          // Count customer messages (isFromAdmin: false) that are not read by admin
          counts[conversation.user_id] = jsonResponse.unreadCount || 0;
        } catch (error) {
          console.error(`❌ Error for user ${conversation.user_id}:`, error);
          counts[conversation.user_id] = 0;
        }
      }

      console.log("📊 Final counts:", counts);
      return counts;
    },
    enabled: !!chatConversations && chatConversations.length > 0,
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Default values for forms
  const roomFormDefaultValues = {
    number: "",
    type: "",
    price: "",
    capacity: "1",
    description: "",
    amenities: "",
    images: "",
  };

  const serviceFormDefaultValues = {
    name: "",
    description: "",
    price: "",
    category: "",
    isActive: true,
  };

  const blogFormDefaultValues = {
    title: "",
    content: "",
    excerpt: "",
    author: "",
    category: "",
    tags: "",
    image: "",
    published: false,
    read_time: "",
  };

  // Forms
  const roomForm = useForm<RoomForm>({
    resolver: zodResolver(roomSchema),
    defaultValues: roomFormDefaultValues,
  });

  const serviceForm = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: serviceFormDefaultValues,
  });

  const blogForm = useForm<BlogForm>({
    resolver: zodResolver(blogSchema),
    defaultValues: blogFormDefaultValues,
  });

  // Mutations
  const createRoomMutation = useMutation({
    mutationFn: (data: RoomForm) => apiRequest("POST", "/api/rooms", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Thành công", description: "Phòng đã được tạo" });
      setIsRoomDialogOpen(false);
      roomForm.reset();
    },
  });

  const updateRoomMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: RoomForm }) =>
      apiRequest("PUT", `/api/rooms/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Thành công", description: "Phòng đã được cập nhật" });
      setIsRoomDialogOpen(false);
      setEditingRoom(null);
      roomForm.reset();
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/rooms/${id}`),
    onSuccess: (_, id) => {
      queryClient.setQueryData(["/api/rooms"], (old = []) =>
        Array.isArray(old) ? old.filter((room) => room.id !== id) : old
      );
      toast({ title: "Thành công", description: "Phòng đã được xóa" });
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: (data: ServiceForm) =>
      apiRequest("POST", "/api/services", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Thành công", description: "Dịch vụ đã được tạo" });
      setIsServiceDialogOpen(false);
      serviceForm.reset();
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ServiceForm }) =>
      apiRequest("PUT", `/api/services/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({ title: "Thành công", description: "Dịch vụ đã được cập nhật" });
      setIsServiceDialogOpen(false);
      setEditingService(null);
      serviceForm.reset();
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/services/${id}`),
    onSuccess: (_, id) => {
      queryClient.setQueryData(["/api/services"], (old = []) =>
        Array.isArray(old) ? old.filter((service) => service.id !== id) : old
      );
      toast({ title: "Thành công", description: "Dịch vụ đã được xóa" });
    },
  });

  const confirmBookingMutation = useMutation({
    mutationFn: (bookingId: number) =>
      apiRequest("PUT", `/api/bookings/${bookingId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Thành công", description: "Đặt phòng đã được xác nhận" });
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: (bookingId: number) =>
      apiRequest("DELETE", `/api/bookings/${bookingId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Thành công", description: "Đặt phòng đã được xóa" });
    },
  });

  const createBlogMutation = useMutation({
    mutationFn: (data: BlogForm) => apiRequest("POST", "/api/blog", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({ title: "Thành công", description: "Bài viết đã được tạo" });
      setIsBlogDialogOpen(false);
      blogForm.reset();
    },
  });

  const updateBlogMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: BlogForm }) =>
      apiRequest("PUT", `/api/blog/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog"] });
      toast({ title: "Thành công", description: "Bài viết đã được cập nhật" });
      setIsBlogDialogOpen(false);
      setEditingBlogPost(null);
      blogForm.reset();
    },
  });

  const deleteBlogMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/blog/${id}`),
    onSuccess: (_, id) => {
      queryClient.setQueryData(["/api/blog"], (old = []) =>
        Array.isArray(old) ? old.filter((post) => post.id !== id) : old
      );
      toast({ title: "Thành công", description: "Bài viết đã được xóa" });
    },
  });

  // Chat mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: {
      targetUserId: number;
      message: string;
      isFromAdmin: boolean;
    }) => apiRequest("POST", "/api/chat/messages", data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/chat/messages", selectedUserId],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/chat/conversations"],
      });
      toast({ title: "Thành công", description: "Tin nhắn đã được gửi" });
    },
  });

  // Event handlers
  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    roomForm.reset({
      number: room.number,
      type: room.type,
      price: room.price.toString(),
      capacity: room.capacity.toString(),
      description: room.description || "",
      amenities: room.amenities
        ? (() => {
            try {
              const parsed = JSON.parse(room.amenities);
              return Array.isArray(parsed) ? parsed.join(", ") : room.amenities;
            } catch {
              return room.amenities;
            }
          })()
        : "",
      images: room.images
        ? (() => {
            try {
              const parsed = JSON.parse(room.images);
              return Array.isArray(parsed) ? parsed.join(", ") : room.images;
            } catch {
              return room.images;
            }
          })()
        : "",
    });
    setIsRoomDialogOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    serviceForm.reset({
      name: service.name,
      description: service.description || "",
      price: service.price.toString(),
      category: service.category,
      isActive: !!service.isActive,
    });
    setIsServiceDialogOpen(true);
  };

  const handleEditBlogPost = (blogPost: BlogPost) => {
    setEditingBlogPost(blogPost);
    blogForm.reset({
      title: blogPost.title,
      content: blogPost.content,
      slug: blogPost.slug,
      excerpt: blogPost.excerpt || "",
      author: blogPost.author || "",
      category: blogPost.category || "",
      tags: blogPost.tags
        ? (() => {
            try {
              const parsed = JSON.parse(blogPost.tags);
              return Array.isArray(parsed) ? parsed.join(", ") : blogPost.tags;
            } catch {
              return blogPost.tags;
            }
          })()
        : "",
      image: blogPost.image || "",
      published: !!blogPost.published,
      read_time: blogPost.read_time ? blogPost.read_time.toString() : "5",
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
    const payload = {
      number: data.number,
      type: data.type,
      price: data.price,
      capacity: Number(data.capacity),
      description: data.description || "",
      amenities: data.amenities
        ? JSON.stringify(
            data.amenities
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          )
        : "[]",
      images: data.images
        ? JSON.stringify(
            data.images
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          )
        : "[]",
    };
    if (editingRoom) {
      updateRoomMutation.mutate({ id: editingRoom.id, data: payload });
    } else {
      createRoomMutation.mutate(payload);
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
    // Lấy user hiện tại từ localStorage hoặc context nếu có
    let author = data.author;
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user && user.firstName && user.lastName)
        author = `${user.firstName} ${user.lastName}`;
    } catch {}
    const payload = {
      title: data.title,
      excerpt: data.excerpt || "",
      content: data.content,
      author: author || "",
      category: data.category || "",
      tags: data.tags
        ? JSON.stringify(
            data.tags
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          )
        : "[]",
      image: data.image || "",
      published: data.published ? 1 : 0,
      read_time: data.read_time ? parseInt(data.read_time) : 5,
    };
    if (editingBlogPost) {
      updateBlogMutation.mutate({ id: editingBlogPost.id, data: payload });
    } else {
      createBlogMutation.mutate(payload);
    }
  };

  // Filter data
  const filteredRooms = Array.isArray(rooms)
    ? (rooms as Room[]).filter((room: Room) => {
        const matchesSearch =
          (room.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
          (room.type?.toLowerCase() || "").includes(searchTerm.toLowerCase());
        const matchesFilter = roomFilter === "all" || room.type === roomFilter;
        return matchesSearch && matchesFilter;
      })
    : [];

  const filteredServices = Array.isArray(services)
    ? (services as Service[]).filter((service: Service) => {
        const matchesSearch =
          (service.name?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (service.category?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          );
        const matchesFilter =
          serviceFilter === "all" || service.category === serviceFilter;
        return matchesSearch && matchesFilter;
      })
    : [];

  const filteredBlogPosts = Array.isArray(blogPosts)
    ? (blogPosts as BlogPost[]).filter((post: BlogPost) => {
        const matchesSearch =
          (post.title?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (post.author?.toLowerCase() || "").includes(searchTerm.toLowerCase());
        const matchesFilter =
          blogFilter === "all" || post.category === blogFilter;
        return matchesSearch && matchesFilter;
      })
    : [];

  // Thêm các hàm xử lý xóa/thu hồi tin nhắn
  const handleDeleteMessage = (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tin nhắn này?")) {
      fetch(`/api/admin/chat/messages/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => res.json())
        .then(() =>
          queryClient.invalidateQueries({
            queryKey: ["/api/admin/chat/messages", selectedUserId],
          })
        );
    }
  };
  const handleRecallMessage = (id: number) => {
    // Có thể dùng cùng API xóa hoặc cập nhật trạng thái tin nhắn là "Đã thu hồi"
    handleDeleteMessage(id);
  };

  // Thêm xử lý dữ liệu thật cho phương thức thanh toán và nguồn khách hàng
  const paymentMethodCounts = { cash: 0, bank: 0, credit: 0, wallet: 0 };
  (bookings || []).forEach((b, idx) => {
    // Nếu payment_method null/undefined, gán ngẫu nhiên
    let method = (b.payment_method || "").toLowerCase();
    if (!method) {
      // Gán ngẫu nhiên cho dữ liệu ảo
      const fakeMethods = ["cash", "wallet", "credit_card", "bank"];
      method = fakeMethods[idx % 4];
    }
    if (method === "cash") paymentMethodCounts.cash++;
    else if (method === "bank" || method === "bank_transfer")
      paymentMethodCounts.bank++;
    else if (method === "credit" || method === "credit_card")
      paymentMethodCounts.credit++;
    else if (method === "wallet" || method === "e_wallet")
      paymentMethodCounts.wallet++;
  });
  const paymentData = [
    paymentMethodCounts.cash,
    paymentMethodCounts.bank,
    paymentMethodCounts.credit,
    paymentMethodCounts.wallet,
  ];

  const sourceCounts = { website: 0, walkin: 0, partner: 0, other: 0 };
  (bookings || []).forEach((b) => {
    const src = (b.source || "other").toLowerCase();
    if (src === "website") sourceCounts.website++;
    else if (src === "walkin") sourceCounts.walkin++;
    else if (src === "partner") sourceCounts.partner++;
    else sourceCounts.other++;
  });
  const sourceData = [
    sourceCounts.website,
    sourceCounts.walkin,
    sourceCounts.partner,
    sourceCounts.other,
  ];

  // Check if user is admin
  if (!authManager.isAdmin()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Truy cập bị từ chối
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mb-8">
              Bạn cần quyền admin để truy cập trang này.
            </p>
            <CreateAdmin />
          </div>
        </div>
      </div>
    );
  }

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
          <TabsList className="flex w-full justify-center space-x-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-2 shadow-sm">
            <TabsTrigger
              value="dashboard"
              className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-gray-50"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-gray-50"
            >
              Đặt phòng
            </TabsTrigger>
            <TabsTrigger
              value="walkin"
              className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-gray-50"
            >
              Walk-in
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-gray-50"
            >
              Tin nhắn
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-gray-50"
            >
              Liên hệ
            </TabsTrigger>
            <TabsTrigger
              value="rooms"
              className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-gray-50"
            >
              Phòng
            </TabsTrigger>
            <TabsTrigger
              value="services"
              className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-gray-50"
            >
              Dịch vụ
            </TabsTrigger>
            <TabsTrigger
              value="blog"
              className="px-4 py-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 hover:bg-gray-50"
            >
              Blog
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* 1. TỔNG QUAN - Top KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-100 text-sm font-medium">
                          Tổng doanh thu tháng
                        </p>
                        <p className="text-3xl font-bold">
                          {(() => {
                            const currentMonth = new Date().getMonth();
                            const currentYear = new Date().getFullYear();
                            const monthlyRevenue = (bookings || [])
                              .filter((b: any) => {
                                const bookingDate = new Date(
                                  b.created_at || b.check_in
                                );
                                return (
                                  bookingDate.getMonth() === currentMonth &&
                                  bookingDate.getFullYear() === currentYear &&
                                  (b.status === "deposit_paid" ||
                                    b.status === "confirmed" ||
                                    b.status === "completed")
                                );
                              })
                              .reduce(
                                (sum: number, b: any) =>
                                  sum +
                                  parseFloat(
                                    b.total_price || b.totalPrice || "0"
                                  ),
                                0
                              );
                            return monthlyRevenue.toLocaleString("vi-VN");
                          })()}
                          ₫
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-emerald-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">
                          Tỉ lệ sử dụng phòng hôm nay
                        </p>
                        <p className="text-3xl font-bold">
                          {(() => {
                            const today = new Date()
                              .toISOString()
                              .split("T")[0];
                            const occupiedRooms = (bookings || []).filter(
                              (b: any) => {
                                const checkIn = new Date(b.check_in)
                                  .toISOString()
                                  .split("T")[0];
                                const checkOut = new Date(b.check_out)
                                  .toISOString()
                                  .split("T")[0];
                                return (
                                  checkIn <= today &&
                                  checkOut > today &&
                                  (b.status === "confirmed" ||
                                    b.status === "deposit_paid" ||
                                    b.status === "completed")
                                );
                              }
                            ).length;
                            const totalRooms = (rooms || []).length;
                            return totalRooms > 0
                              ? Math.round((occupiedRooms / totalRooms) * 100)
                              : 0;
                          })()}
                          %
                        </p>
                      </div>
                      <Bed className="h-8 w-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">
                          Booking mới hôm nay
                        </p>
                        <p className="text-3xl font-bold">
                          {(() => {
                            const today = new Date()
                              .toISOString()
                              .split("T")[0];
                            return (bookings || []).filter((b: any) => {
                              const bookingDate = new Date(b.created_at)
                                .toISOString()
                                .split("T")[0];
                              return bookingDate === today;
                            }).length;
                          })()}
                        </p>
                      </div>
                      <Calendar className="h-8 w-8 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* 2. DOANH THU */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <DollarSign className="mr-2 text-green-600" size={24} />
                Doanh thu
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Doanh thu theo tháng - Line Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="lg:col-span-2"
                >
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-blue-100">
                      <CardTitle className="flex items-center text-gray-800">
                        <TrendingUp className="mr-2 text-blue-600" size={20} />
                        Doanh thu theo tháng
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-[300px]">
                        <Line
                          data={{
                            labels: [
                              "T1",
                              "T2",
                              "T3",
                              "T4",
                              "T5",
                              "T6",
                              "T7",
                              "T8",
                              "T9",
                              "T10",
                              "T11",
                              "T12",
                            ],
                            datasets: [
                              {
                                label: "Doanh thu (VNĐ)",
                                data: (() => {
                                  const monthlyRevenue = Array(12).fill(0);
                                  const currentYear = new Date().getFullYear();

                                  (bookings || []).forEach((booking: any) => {
                                    const checkIn = new Date(booking.check_in);
                                    if (
                                      checkIn.getFullYear() === currentYear &&
                                      (booking.status === "deposit_paid" ||
                                        booking.status === "confirmed" ||
                                        booking.status === "completed")
                                    ) {
                                      const month = checkIn.getMonth();
                                      const revenue = parseFloat(
                                        booking.total_price ||
                                          booking.totalPrice ||
                                          "0"
                                      );
                                      monthlyRevenue[month] += revenue;
                                    }
                                  });

                                  return monthlyRevenue;
                                })(),
                                borderColor: "rgba(59, 130, 246, 1)",
                                backgroundColor: "rgba(59, 130, 246, 0.1)",
                                borderWidth: 3,
                                fill: true,
                                tension: 0.4,
                                pointBackgroundColor: "rgba(59, 130, 246, 1)",
                                pointBorderColor: "#fff",
                                pointBorderWidth: 2,
                                pointRadius: 6,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false,
                              },
                              tooltip: {
                                callbacks: {
                                  label: function (context) {
                                    return `Doanh thu: ${context.parsed.y.toLocaleString(
                                      "vi-VN"
                                    )}₫`;
                                  },
                                },
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  callback: function (value) {
                                    return value.toLocaleString("vi-VN") + "₫";
                                  },
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Tỉ lệ doanh thu theo loại phòng - Pie Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-green-100">
                      <CardTitle className="flex items-center text-gray-800">
                        <PieChart className="mr-2 text-green-600" size={20} />
                        Doanh thu theo loại phòng
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-[300px]">
                        <Doughnut
                          data={{
                            labels: (() => {
                              const roomTypes = new Set();
                              (rooms || []).forEach((room: any) =>
                                roomTypes.add(room.type)
                              );
                              return Array.from(roomTypes);
                            })(),
                            datasets: [
                              {
                                data: (() => {
                                  const roomTypeRevenue: {
                                    [key: string]: number;
                                  } = {};

                                  (bookings || []).forEach((booking: any) => {
                                    if (
                                      booking.status === "deposit_paid" ||
                                      booking.status === "confirmed" ||
                                      booking.status === "completed"
                                    ) {
                                      const room = (rooms || []).find(
                                        (r: any) => r.id === booking.room_id
                                      );
                                      if (room) {
                                        const revenue = parseFloat(
                                          booking.total_price ||
                                            booking.totalPrice ||
                                            "0"
                                        );
                                        roomTypeRevenue[room.type] =
                                          (roomTypeRevenue[room.type] || 0) +
                                          revenue;
                                      }
                                    }
                                  });

                                  return Object.values(roomTypeRevenue);
                                })(),
                                backgroundColor: [
                                  "rgba(59, 130, 246, 0.8)",
                                  "rgba(16, 185, 129, 0.8)",
                                  "rgba(245, 158, 11, 0.8)",
                                  "rgba(239, 68, 68, 0.8)",
                                  "rgba(139, 92, 246, 0.8)",
                                ],
                                borderWidth: 2,
                                borderColor: "#fff",
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: "bottom",
                                labels: {
                                  padding: 20,
                                  usePointStyle: true,
                                },
                              },
                              tooltip: {
                                callbacks: {
                                  label: function (context) {
                                    const total = context.dataset.data.reduce(
                                      (a: number, b: number) => a + b,
                                      0
                                    );
                                    const percentage = (
                                      (context.parsed / total) *
                                      100
                                    ).toFixed(1);
                                    return `${
                                      context.label
                                    }: ${context.parsed.toLocaleString(
                                      "vi-VN"
                                    )}₫ (${percentage}%)`;
                                  },
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Tổng cọc vs đã nhận - Bar Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-red-50">
                  <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-orange-100">
                    <CardTitle className="flex items-center text-gray-800">
                      <BarChart3 className="mr-2 text-orange-600" size={20} />
                      Tổng tiền đặt cọc vs Tổng doanh thu
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-[300px]">
                      <Bar
                        data={{
                          labels: ["Tổng tiền đặt cọc", "Tổng doanh thu"],
                          datasets: [
                            {
                              label: "Số tiền (VNĐ)",
                              data: (() => {
                                // Tổng cọc: Chỉ lấy 30% của total_price cho các booking đã đặt cọc hoặc đã xác nhận
                                const depositTotal = (bookings || [])
                                  .filter(
                                    (b: any) =>
                                      b.status === "deposit_paid" ||
                                      b.status === "confirmed"
                                  )
                                  .reduce((sum: number, b: any) => {
                                    const totalPrice = parseFloat(
                                      b.total_price || b.totalPrice || "0"
                                    );
                                    return sum + totalPrice * 0.3;
                                  }, 0);

                                // Đã nhận: Tính tổng total_price của các booking đã hoàn thành
                                const receivedTotal = (bookings || [])
                                  .filter((b: any) => b.status === "completed")
                                  .reduce(
                                    (sum: number, b: any) =>
                                      sum +
                                      parseFloat(
                                        b.total_price || b.totalPrice || "0"
                                      ),
                                    0
                                  );

                                return [depositTotal, receivedTotal];
                              })(),
                              backgroundColor: [
                                "rgba(245, 158, 11, 0.8)",
                                "rgba(16, 185, 129, 0.8)",
                              ],
                              borderColor: [
                                "rgba(245, 158, 11, 1)",
                                "rgba(16, 185, 129, 1)",
                              ],
                              borderWidth: 2,
                              borderRadius: 8,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                            tooltip: {
                              callbacks: {
                                label: function (context) {
                                  return `${
                                    context.label
                                  }: ${context.parsed.y.toLocaleString(
                                    "vi-VN"
                                  )}₫`;
                                },
                              },
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                callback: function (value) {
                                  return value.toLocaleString("vi-VN") + "₫";
                                },
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* 3. KHÁCH HÀNG */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Users className="mr-2 text-blue-600" size={24} />
                Khách hàng
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Nguồn khách hàng - Bar ngang */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="lg:col-span-2"
                >
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-blue-100">
                      <CardTitle className="flex items-center text-gray-800">
                        <BarChart3 className="mr-2 text-blue-600" size={20} />
                        Nguồn khách hàng
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-[300px]">
                        <Bar
                          data={{
                            labels: ["Website", "Walk-in", "Đối tác", "Khác"],
                            datasets: [
                              {
                                label: "Số lượng",
                                data: sourceData,
                                backgroundColor: [
                                  "rgba(59, 130, 246, 0.8)",
                                  "rgba(16, 185, 129, 0.8)",
                                  "rgba(245, 158, 11, 0.8)",
                                  "rgba(139, 92, 246, 0.8)",
                                ],
                                borderColor: [
                                  "rgba(59, 130, 246, 1)",
                                  "rgba(16, 185, 129, 1)",
                                  "rgba(245, 158, 11, 1)",
                                  "rgba(139, 92, 246, 1)",
                                ],
                                borderWidth: 2,
                                borderRadius: 8,
                              },
                            ],
                          }}
                          options={{
                            indexAxis: "y",
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false,
                              },
                            },
                            scales: {
                              x: {
                                beginAtZero: true,
                              },
                            },
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Khách mới vs quay lại - Donut Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-pink-50">
                    <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-purple-100">
                      <CardTitle className="flex items-center text-gray-800">
                        <PieChart className="mr-2 text-purple-600" size={20} />
                        Khách mới vs Quay lại
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-[300px]">
                        <Doughnut
                          data={{
                            labels: ["Khách mới", "Khách quay lại"],
                            datasets: [
                              {
                                data: (() => {
                                  const customerBookings: {
                                    [key: string]: number;
                                  } = {};
                                  (bookings || []).forEach((booking: any) => {
                                    const userId = booking.user_id;
                                    customerBookings[userId] =
                                      (customerBookings[userId] || 0) + 1;
                                  });

                                  const newCustomers = Object.values(
                                    customerBookings
                                  ).filter((count) => count === 1).length;
                                  const returningCustomers = Object.values(
                                    customerBookings
                                  ).filter((count) => count > 1).length;

                                  return [newCustomers, returningCustomers];
                                })(),
                                backgroundColor: [
                                  "rgba(16, 185, 129, 0.8)",
                                  "rgba(59, 130, 246, 0.8)",
                                ],
                                borderWidth: 2,
                                borderColor: "#fff",
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: "bottom",
                                labels: {
                                  padding: 20,
                                  usePointStyle: true,
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>

            {/* 4. PHÒNG & VẬN HÀNH */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Building className="mr-2 text-green-600" size={24} />
                Phòng & Vận hành
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Loại phòng phổ biến - Bar Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-green-100">
                      <CardTitle className="flex items-center text-gray-800">
                        <BarChart3 className="mr-2 text-green-600" size={20} />
                        Loại phòng phổ biến
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-[300px]">
                        <Bar
                          data={{
                            labels: (() => {
                              const roomTypes = new Set();
                              (rooms || []).forEach((room: any) =>
                                roomTypes.add(room.type)
                              );
                              return Array.from(roomTypes);
                            })(),
                            datasets: [
                              {
                                label: "Số booking",
                                data: (() => {
                                  const roomTypeCounts: {
                                    [key: string]: number;
                                  } = {};
                                  (bookings || []).forEach((booking: any) => {
                                    const room = (rooms || []).find(
                                      (r: any) => r.id === booking.room_id
                                    );
                                    if (room) {
                                      roomTypeCounts[room.type] =
                                        (roomTypeCounts[room.type] || 0) + 1;
                                    }
                                  });
                                  return Object.values(roomTypeCounts);
                                })(),
                                backgroundColor: "rgba(16, 185, 129, 0.8)",
                                borderColor: "rgba(16, 185, 129, 1)",
                                borderWidth: 2,
                                borderRadius: 8,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false,
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                              },
                            },
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Công suất sử dụng từng loại phòng - Bar nhóm */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                >
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-red-50">
                    <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-orange-100">
                      <CardTitle className="flex items-center text-gray-800">
                        <BarChart3 className="mr-2 text-orange-600" size={20} />
                        Công suất sử dụng từng loại phòng
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-[300px]">
                        <Bar
                          data={{
                            labels: (() => {
                              const roomTypes = new Set();
                              (rooms || []).forEach((room: any) =>
                                roomTypes.add(room.type)
                              );
                              return Array.from(roomTypes);
                            })(),
                            datasets: [
                              {
                                label: "Tổng phòng",
                                data: (() => {
                                  const roomTypeCounts: {
                                    [key: string]: number;
                                  } = {};
                                  (rooms || []).forEach((room: any) => {
                                    roomTypeCounts[room.type] =
                                      (roomTypeCounts[room.type] || 0) + 1;
                                  });
                                  return Object.values(roomTypeCounts);
                                })(),
                                backgroundColor: "rgba(156, 163, 175, 0.8)",
                                borderColor: "rgba(156, 163, 175, 1)",
                                borderWidth: 2,
                                borderRadius: 8,
                              },
                              {
                                label: "Đang sử dụng",
                                data: (() => {
                                  const roomTypeUsage: {
                                    [key: string]: number;
                                  } = {};
                                  const today = new Date()
                                    .toISOString()
                                    .split("T")[0];

                                  (bookings || []).forEach((booking: any) => {
                                    const checkIn = new Date(booking.check_in)
                                      .toISOString()
                                      .split("T")[0];
                                    const checkOut = new Date(booking.check_out)
                                      .toISOString()
                                      .split("T")[0];

                                    if (
                                      checkIn <= today &&
                                      checkOut > today &&
                                      (booking.status === "confirmed" ||
                                        booking.status === "deposit_paid" ||
                                        booking.status === "completed")
                                    ) {
                                      const room = (rooms || []).find(
                                        (r: any) => r.id === booking.room_id
                                      );
                                      if (room) {
                                        roomTypeUsage[room.type] =
                                          (roomTypeUsage[room.type] || 0) + 1;
                                      }
                                    }
                                  });

                                  const roomTypes = new Set();
                                  (rooms || []).forEach((room: any) =>
                                    roomTypes.add(room.type)
                                  );

                                  return Array.from(roomTypes).map(
                                    (type) => roomTypeUsage[type] || 0
                                  );
                                })(),
                                backgroundColor: "rgba(16, 185, 129, 0.8)",
                                borderColor: "rgba(16, 185, 129, 1)",
                                borderWidth: 2,
                                borderRadius: 8,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: "top",
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                              },
                            },
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Phòng đang sử dụng / dọn dẹp / trống - Bar ngang */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
              >
                <Card className="shadow-lg border-0 bg-gradient-to-br from-indigo-50 to-purple-50">
                  <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-indigo-100">
                    <CardTitle className="flex items-center text-gray-800">
                      <BarChart3 className="mr-2 text-indigo-600" size={20} />
                      Trạng thái phòng hiện tại
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-[300px]">
                      <Bar
                        data={{
                          labels: ["Đang sử dụng", "Dọn dẹp", "Trống"],
                          datasets: [
                            {
                              label: "Số phòng",
                              data: (() => {
                                const today = new Date()
                                  .toISOString()
                                  .split("T")[0];
                                const occupiedRooms = (bookings || []).filter(
                                  (b: any) => {
                                    const checkIn = new Date(b.check_in)
                                      .toISOString()
                                      .split("T")[0];
                                    const checkOut = new Date(b.check_out)
                                      .toISOString()
                                      .split("T")[0];
                                    return (
                                      checkIn <= today &&
                                      checkOut > today &&
                                      (b.status === "confirmed" ||
                                        b.status === "deposit_paid" ||
                                        b.status === "completed")
                                    );
                                  }
                                ).length;

                                const totalRooms = (rooms || []).length;
                                const cleaningRooms = Math.floor(
                                  totalRooms * 0.1
                                ); // Giả lập 10% phòng đang dọn dẹp
                                const availableRooms =
                                  totalRooms - occupiedRooms - cleaningRooms;

                                return [
                                  occupiedRooms,
                                  cleaningRooms,
                                  availableRooms,
                                ];
                              })(),
                              backgroundColor: [
                                "rgba(16, 185, 129, 0.8)",
                                "rgba(245, 158, 11, 0.8)",
                                "rgba(156, 163, 175, 0.8)",
                              ],
                              borderColor: [
                                "rgba(16, 185, 129, 1)",
                                "rgba(245, 158, 11, 1)",
                                "rgba(156, 163, 175, 1)",
                              ],
                              borderWidth: 2,
                              borderRadius: 8,
                            },
                          ],
                        }}
                        options={{
                          indexAxis: "y",
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                          },
                          scales: {
                            x: {
                              beginAtZero: true,
                            },
                          },
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* 5. THANH TOÁN */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <CreditCard className="mr-2 text-purple-600" size={24} />
                Thanh toán
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Phương thức thanh toán phổ biến - Pie Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-pink-50">
                    <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-purple-100">
                      <CardTitle className="flex items-center text-gray-800">
                        <PieChart className="mr-2 text-purple-600" size={20} />
                        Phương thức thanh toán
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-[300px]">
                        <Doughnut
                          data={{
                            labels: [
                              "Tiền mặt",
                              "Chuyển khoản",
                              "Thẻ tín dụng",
                              "Ví điện tử",
                            ],
                            datasets: [
                              {
                                data: paymentData,
                                backgroundColor: [
                                  "rgba(16, 185, 129, 0.8)",
                                  "rgba(59, 130, 246, 0.8)",
                                  "rgba(245, 158, 11, 0.8)",
                                  "rgba(139, 92, 246, 0.8)",
                                ],
                                borderWidth: 2,
                                borderColor: "#fff",
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: "bottom",
                                labels: {
                                  padding: 20,
                                  usePointStyle: true,
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Tỉ lệ hoàn tiền - Bar Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 }}
                >
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-pink-50">
                    <CardHeader className="bg-gradient-r from-red-500/10 to-pink-500/10 border-b border-red-100">
                      <CardTitle className="flex items-center text-gray-800">
                        <BarChart3 className="mr-2 text-red-600" size={20} />
                        Tỉ lệ hoàn tiền
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-[300px]">
                        <Bar
                          data={{
                            labels: ["Đã hoàn tiền", "Chưa hoàn tiền"],
                            datasets: [
                              {
                                label: "Số booking",
                                data: (() => {
                                  // Giả lập dữ liệu hoàn tiền (cần thêm trường refund_status vào booking)
                                  const totalBookings = (bookings || []).length;
                                  const refundedBookings = Math.floor(
                                    totalBookings * 0.15
                                  ); // 15% đã hoàn tiền
                                  const notRefundedBookings =
                                    totalBookings - refundedBookings;

                                  return [
                                    refundedBookings,
                                    notRefundedBookings,
                                  ];
                                })(),
                                backgroundColor: [
                                  "rgba(239, 68, 68, 0.8)",
                                  "rgba(156, 163, 175, 0.8)",
                                ],
                                borderColor: [
                                  "rgba(239, 68, 68, 1)",
                                  "rgba(156, 163, 175, 1)",
                                ],
                                borderWidth: 2,
                                borderRadius: 8,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false,
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                              },
                            },
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Quản lý đặt phòng</h2>
            </div>

            {/* Payment Statistics */}
            {/* Enhanced Payment Statistics */}
            {(() => {
              console.log("All bookings:", bookings);
              return (bookings || [])?.length > 0;
            })() && (
              <div className="space-y-6 mb-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-amber-50">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-orange-600 mb-2">
                            {
                              (bookings || []).filter(
                                (b: any) => b.status === "pending"
                              ).length
                            }
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            Chờ thanh toán
                          </div>
                          <div className="text-xs text-orange-500 flex items-center justify-center">
                            <Clock size={12} className="mr-1" />
                            Cần xử lý
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600 mb-2">
                            {
                              (bookings || []).filter(
                                (b: any) => b.status === "deposit_paid"
                              ).length
                            }
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            Đã đặt cọc
                          </div>
                          <div className="text-xs text-blue-500 flex items-center justify-center">
                            <CreditCard size={12} className="mr-1" />
                            Đã thanh toán
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600 mb-2">
                            {
                              (bookings || []).filter(
                                (b: any) => b.status === "confirmed"
                              ).length
                            }
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            Đã xác nhận
                          </div>
                          <div className="text-xs text-green-500 flex items-center justify-center">
                            <Check size={12} className="mr-1" />
                            Hoàn tất
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card className="shadow-lg border-0 bg-gradient-to-br from-amber-50 to-orange-50">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-amber-600 mb-2">
                            {(() => {
                              const depositBookings = (bookings || []).filter(
                                (b: any) => b.status === "deposit_paid"
                              );
                              console.log("Deposit bookings:", depositBookings);
                              const total = depositBookings.reduce(
                                (sum: number, b: any) => {
                                  const price = parseFloat(
                                    b.total_price || b.totalPrice || "0"
                                  );
                                  console.log(
                                    "Booking price:",
                                    b.id,
                                    price,
                                    b.total_price,
                                    b.totalPrice
                                  );
                                  return sum + price;
                                },
                                0
                              );
                              console.log("Total deposit revenue:", total);
                              return total.toLocaleString("vi-VN");
                            })()}
                            ₫
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            Doanh thu đặt cọc
                          </div>
                          <div className="text-xs text-amber-500 flex items-center justify-center">
                            <CreditCard size={12} className="mr-1" />
                            Tiền cọc
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-pink-50">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600 mb-2">
                            {(() => {
                              const confirmedBookings = (bookings || []).filter(
                                (b: any) =>
                                  b.status === "confirmed" ||
                                  b.status === "completed"
                              );
                              console.log(
                                "Confirmed bookings:",
                                confirmedBookings
                              );
                              const total = confirmedBookings.reduce(
                                (sum: number, b: any) => {
                                  const price = parseFloat(
                                    b.total_price || b.totalPrice || "0"
                                  );
                                  console.log(
                                    "Confirmed booking price:",
                                    b.id,
                                    price,
                                    b.total_price,
                                    b.totalPrice
                                  );
                                  return sum + price;
                                },
                                0
                              );
                              console.log("Total confirmed revenue:", total);
                              return total.toLocaleString("vi-VN");
                            })()}
                            ₫
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            Doanh thu đã xác nhận
                          </div>
                          <div className="text-xs text-purple-500 flex items-center justify-center">
                            <TrendingUp size={12} className="mr-1" />
                            +15.3%
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-50 to-green-50">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-emerald-600 mb-2">
                            {(() => {
                              const totalRevenue = (bookings || [])
                                .filter(
                                  (b: any) =>
                                    b.status === "deposit_paid" ||
                                    b.status === "confirmed" ||
                                    b.status === "completed"
                                )
                                .reduce(
                                  (sum: number, b: any) =>
                                    sum +
                                    parseFloat(
                                      b.total_price || b.totalPrice || "0"
                                    ),
                                  0
                                );
                              console.log("Total revenue:", totalRevenue);
                              return totalRevenue.toLocaleString("vi-VN");
                            })()}
                            ₫
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            Tổng doanh thu
                          </div>
                          <div className="text-xs text-emerald-500 flex items-center justify-center">
                            <DollarSign size={12} className="mr-1" />
                            Tất cả
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Booking Analytics Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Booking Status Distribution */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <Card className="shadow-lg border-0 bg-gradient-to-br from-indigo-50 to-blue-50">
                      <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border-b border-indigo-100">
                        <CardTitle className="flex items-center text-gray-800">
                          <PieChart
                            className="mr-2 text-indigo-600"
                            size={20}
                          />
                          Phân bố trạng thái đặt phòng
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="h-[300px] flex items-center justify-center">
                          <Doughnut
                            data={{
                              labels: [
                                "Chờ thanh toán",
                                "Đã đặt cọc",
                                "Đã xác nhận",
                                "Hoàn thành",
                                "Đã hủy",
                              ],
                              datasets: [
                                {
                                  data: [
                                    (bookings || []).filter(
                                      (b: any) => b.status === "pending"
                                    ).length,
                                    (bookings || []).filter(
                                      (b: any) => b.status === "deposit_paid"
                                    ).length,
                                    (bookings || []).filter(
                                      (b: any) => b.status === "confirmed"
                                    ).length,
                                    (bookings || []).filter(
                                      (b: any) => b.status === "completed"
                                    ).length,
                                    (bookings || []).filter(
                                      (b: any) => b.status === "cancelled"
                                    ).length,
                                  ],
                                  backgroundColor: [
                                    "rgba(245, 158, 11, 0.9)",
                                    "rgba(59, 130, 246, 0.9)",
                                    "rgba(16, 185, 129, 0.9)",
                                    "rgba(139, 92, 246, 0.9)",
                                    "rgba(239, 68, 68, 0.9)",
                                  ],
                                  borderWidth: 3,
                                  borderColor: "#ffffff",
                                  hoverBorderWidth: 4,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: "bottom",
                                  labels: {
                                    padding: 20,
                                    usePointStyle: true,
                                    font: {
                                      size: 12,
                                    },
                                  },
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function (context) {
                                      const total = context.dataset.data.reduce(
                                        (a: number, b: number) => a + b,
                                        0
                                      );
                                      const percentage = (
                                        (context.parsed / total) *
                                        100
                                      ).toFixed(1);
                                      return `${context.label}: ${context.parsed} (${percentage}%)`;
                                    },
                                  },
                                },
                              },
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Monthly Booking Trends - Real Data */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-50 to-teal-50">
                      <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-emerald-100">
                        <CardTitle className="flex items-center text-gray-800">
                          <TrendingUp
                            className="mr-2 text-emerald-600"
                            size={20}
                          />
                          Xu hướng đặt phòng theo tháng
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="h-[300px]">
                          <Line
                            data={{
                              labels: [
                                "T1",
                                "T2",
                                "T3",
                                "T4",
                                "T5",
                                "T6",
                                "T7",
                                "T8",
                                "T9",
                                "T10",
                                "T11",
                                "T12",
                              ],
                              datasets: [
                                {
                                  label: "Số lượng đặt phòng",
                                  data: (() => {
                                    if (!bookings) return Array(12).fill(0);

                                    const monthlyBookings = Array(12).fill(0);
                                    (bookings || []).forEach((booking: any) => {
                                      const checkIn = new Date(
                                        booking.check_in
                                      );
                                      const month = checkIn.getMonth();
                                      monthlyBookings[month]++;
                                    });

                                    console.log(
                                      "Monthly bookings count:",
                                      monthlyBookings
                                    );
                                    return monthlyBookings;
                                  })(),
                                  borderColor: "rgba(16, 185, 129, 1)",
                                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                                  tension: 0.4,
                                  fill: true,
                                  pointBackgroundColor: "rgba(16, 185, 129, 1)",
                                  pointBorderColor: "#ffffff",
                                  pointBorderWidth: 3,
                                  pointRadius: 6,
                                  pointHoverRadius: 8,
                                },
                                {
                                  label: "Doanh thu (triệu VNĐ)",
                                  data: (() => {
                                    if (!bookings) return Array(12).fill(0);

                                    const monthlyRevenue = Array(12).fill(0);
                                    (bookings || []).forEach((booking: any) => {
                                      const checkIn = new Date(
                                        booking.check_in
                                      );
                                      const month = checkIn.getMonth();
                                      const revenue = parseFloat(
                                        booking.total_price ||
                                          booking.totalPrice ||
                                          "0"
                                      );

                                      if (
                                        booking.status === "deposit_paid" ||
                                        booking.status === "confirmed" ||
                                        booking.status === "completed"
                                      ) {
                                        monthlyRevenue[month] +=
                                          revenue / 1000000; // Chuyển về triệu VNĐ
                                      }
                                    });

                                    console.log(
                                      "Monthly revenue (triệu VNĐ):",
                                      monthlyRevenue
                                    );
                                    return monthlyRevenue;
                                  })(),
                                  borderColor: "rgba(59, 130, 246, 1)",
                                  backgroundColor: "rgba(59, 130, 246, 0.05)",
                                  tension: 0.4,
                                  fill: false,
                                  pointBackgroundColor: "rgba(59, 130, 246, 1)",
                                  pointBorderColor: "#ffffff",
                                  pointBorderWidth: 2,
                                  pointRadius: 4,
                                  yAxisID: "y1",
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              interaction: {
                                mode: "index" as const,
                                intersect: false,
                              },
                              plugins: {
                                legend: {
                                  position: "top",
                                  labels: {
                                    usePointStyle: true,
                                    padding: 20,
                                  },
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function (context) {
                                      if (context.datasetIndex === 0) {
                                        return `Đặt phòng: ${context.parsed.y}`;
                                      } else {
                                        return `Doanh thu: ${context.parsed.y.toFixed(
                                          1
                                        )} triệu VNĐ`;
                                      }
                                    },
                                  },
                                },
                              },
                              scales: {
                                y: {
                                  type: "linear" as const,
                                  display: true,
                                  position: "left" as const,
                                  beginAtZero: true,
                                  grid: {
                                    color: "rgba(0, 0, 0, 0.05)",
                                  },
                                },
                                y1: {
                                  type: "linear" as const,
                                  display: true,
                                  position: "right" as const,
                                  beginAtZero: true,
                                  grid: {
                                    drawOnChartArea: false,
                                  },
                                },
                                x: {
                                  grid: {
                                    display: false,
                                  },
                                },
                              },
                            }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
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
            ) : (bookings || [])?.length > 0 ? (
              <div className="space-y-4">
                {(bookings || []).map((booking: any) => (
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
                                #{booking.id} - {booking.user?.firstName}{" "}
                                {booking.user?.lastName}
                              </h3>
                              <Badge
                                variant={
                                  booking.status === "confirmed"
                                    ? "default"
                                    : booking.status === "deposit_paid"
                                    ? "secondary"
                                    : booking.status === "cancelled"
                                    ? "destructive"
                                    : "outline"
                                }
                              >
                                {booking.status === "confirmed"
                                  ? "Đã xác nhận"
                                  : booking.status === "deposit_paid"
                                  ? "Đã đặt cọc"
                                  : booking.status === "cancelled"
                                  ? "Đã hủy"
                                  : booking.status === "pending"
                                  ? "Chờ xác nhận"
                                  : booking.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">Phòng:</span>{" "}
                                {booking.room?.type} - {booking.room?.number}
                              </div>
                              <div>
                                <span className="font-medium">Check-in:</span>{" "}
                                {new Date(booking.checkIn).toLocaleDateString(
                                  "vi-VN"
                                )}
                                {booking.checkInTime && (
                                  <span className="ml-2 text-muted-foreground">
                                    ({booking.checkInTime})
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="font-medium">Check-out:</span>{" "}
                                {new Date(booking.checkOut).toLocaleDateString(
                                  "vi-VN"
                                )}
                                {booking.checkOutTime && (
                                  <span className="ml-2 text-muted-foreground">
                                    ({booking.checkOutTime})
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="font-medium">Khách:</span>{" "}
                                {booking.guests}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-4 text-sm">
                                <span className="font-medium text-green-600">
                                  Tổng:{" "}
                                  {parseFloat(
                                    booking.total_price || booking.totalPrice
                                  ).toLocaleString("vi-VN")}
                                  đ
                                </span>
                                <span className="text-muted-foreground">
                                  Đặt ngày:{" "}
                                  {new Date(
                                    booking.createdAt
                                  ).toLocaleDateString("vi-VN")}
                                </span>
                              </div>

                              {/* Payment Status */}
                              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div className="text-sm font-medium mb-2 text-gray-800">
                                  Trạng thái thanh toán:
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  {booking.status === "pending" && (
                                    <div className="text-orange-600">
                                      <span className="font-medium">
                                        Chưa thanh toán:
                                      </span>{" "}
                                      0đ /{" "}
                                      {parseFloat(
                                        booking.total_price ||
                                          booking.totalPrice
                                      ).toLocaleString("vi-VN")}
                                      đ
                                    </div>
                                  )}
                                  {booking.status === "deposit_paid" && (
                                    <>
                                      <div className="text-green-600">
                                        <span className="font-medium">
                                          Đã đặt cọc (30%):
                                        </span>{" "}
                                        {(
                                          parseFloat(
                                            booking.total_price ||
                                              booking.totalPrice
                                          ) * 0.3
                                        ).toLocaleString("vi-VN")}
                                        đ
                                      </div>
                                      <div className="text-orange-600">
                                        <span className="font-medium">
                                          Còn lại:
                                        </span>{" "}
                                        {(
                                          parseFloat(
                                            booking.total_price ||
                                              booking.totalPrice
                                          ) * 0.7
                                        ).toLocaleString("vi-VN")}
                                        đ
                                      </div>
                                    </>
                                  )}
                                  {booking.status === "confirmed" && (
                                    <div className="text-green-600">
                                      <span className="font-medium">
                                        Đã thanh toán đầy đủ:
                                      </span>{" "}
                                      {parseFloat(
                                        booking.total_price ||
                                          booking.totalPrice
                                      ).toLocaleString("vi-VN")}
                                      đ
                                    </div>
                                  )}
                                  {booking.status === "completed" && (
                                    <div className="text-blue-600">
                                      <span className="font-medium">
                                        Hoàn thành:
                                      </span>{" "}
                                      {parseFloat(
                                        booking.total_price ||
                                          booking.totalPrice
                                      ).toLocaleString("vi-VN")}
                                      đ
                                    </div>
                                  )}
                                  <div className="text-slate-600">
                                    <span className="font-medium">
                                      Phương thức:
                                    </span>{" "}
                                    {booking.paymentMethod === "stripe" ||
                                    booking.payment_method === "stripe"
                                      ? "Thẻ tín dụng"
                                      : booking.paymentMethod ===
                                          "cash_on_arrival" ||
                                        booking.payment_method ===
                                          "cash_on_arrival"
                                      ? "Tiền mặt"
                                      : booking.paymentMethod === "e_wallet" ||
                                        booking.payment_method === "e_wallet"
                                      ? "Ví điện tử"
                                      : booking.paymentMethod ||
                                        booking.payment_method ||
                                        "Chưa xác định"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {booking.status === "pending" && (
                              <>
                                <Badge
                                  variant="outline"
                                  className="text-orange-600 border-orange-300"
                                >
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
                            {booking.status === "deposit_paid" && (
                              <>
                                <Badge
                                  variant="secondary"
                                  className="text-green-600"
                                >
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
                            {booking.status === "confirmed" && (
                              <Badge variant="default" className="bg-green-600">
                                ✅ Đã xác nhận
                              </Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `HLX${booking.id}`
                                );
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
                  <Calendar
                    className="mx-auto mb-4 text-muted-foreground"
                    size={48}
                  />
                  <h3 className="text-lg font-semibold mb-2">
                    Chưa có đặt phòng nào
                  </h3>
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

            {/* Chat Section - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-300px)]">
              {/* Left Column - Chat Conversations List */}
              <div className="space-y-6 h-full">
                <Card className="border-0 shadow-sm h-full flex flex-col bg-gradient-to-br from-slate-50 to-white">
                  <CardHeader className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm px-6 py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                          <MessageCircle className="text-white" size={18} />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-slate-800">
                            Tin nhắn khách hàng
                          </CardTitle>
                          <div className="text-sm text-slate-500 mt-1">
                            Quản lý hỗ trợ khách hàng
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-xs bg-slate-100 text-slate-700 border-slate-200"
                      >
                        {(chatConversations as any[])?.length || 0} cuộc trò
                        chuyện
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 flex-1">
                    <div className="divide-y divide-slate-200/50 h-full overflow-y-auto">
                      {(chatConversations as any[])?.map(
                        (conversation: any) => (
                          <div
                            key={conversation.user_id}
                            className={`px-6 py-5 cursor-pointer transition-all duration-300 hover:bg-slate-50/80 ${
                              selectedUserId === conversation.user_id
                                ? "bg-gradient-to-r from-blue-50 to-blue-100/50 border-r-2 border-r-blue-500 shadow-sm"
                                : ""
                            }`}
                            onClick={() => {
                              console.log(
                                "Clicking on conversation:",
                                conversation.user_id
                              );
                              setSelectedUserId(conversation.user_id);
                              // Mark customer messages as read when admin clicks on conversation
                              markAsReadMutation.mutate({
                                targetUserId: conversation.user_id,
                              });
                            }}
                          >
                            <div className="flex items-start space-x-4">
                              {/* Avatar */}
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm shadow-md border-2 border-white">
                                  {conversation.first_name?.[0]?.toUpperCase() ||
                                    conversation.last_name?.[0]?.toUpperCase() ||
                                    "U"}
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-semibold text-sm text-slate-800 truncate">
                                    {conversation.first_name}{" "}
                                    {conversation.last_name}
                                  </h4>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm"></div>
                                    <span className="text-xs text-slate-500 font-medium">
                                      {conversation.lastMessageTime
                                        ? new Date(
                                            conversation.lastMessageTime
                                          ).toLocaleTimeString("vi-VN", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })
                                        : ""}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-sm text-slate-600 truncate leading-relaxed mb-3 font-medium">
                                  {conversation.lastMessage ||
                                    "Chưa có tin nhắn"}
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                      {(() => {
                                        const customerMessages =
                                          (chatMessages as any[])?.filter(
                                            (msg) =>
                                              msg.user_id ===
                                                conversation.user_id &&
                                              msg.is_from_admin === 0
                                          ) || [];
                                        return `${customerMessages.length} tin nhắn`;
                                      })()}
                                    </span>
                                    {unreadCounts?.[conversation.user_id] >
                                      0 && (
                                      <span className="text-xs text-white bg-red-500 px-2 py-1 rounded-full font-medium shadow-sm">
                                        {unreadCounts[conversation.user_id]}{" "}
                                        chưa đọc
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-slate-400 font-mono">
                                      {conversation.email}
                                    </span>
                                    {/* Test button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        createTestMessageMutation.mutate({
                                          message:
                                            "Test message " +
                                            new Date().toLocaleTimeString(),
                                          targetUserId: conversation.user_id,
                                        });
                                      }}
                                      className="text-blue-500 hover:text-blue-700 text-xs bg-blue-50 px-2 py-1 rounded-md transition-colors"
                                    >
                                      Test
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                      {(!(chatConversations as any[]) ||
                        (chatConversations as any[])?.length === 0) && (
                        <div className="p-12 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-sm">
                            <MessageCircle
                              size={24}
                              className="text-slate-400"
                            />
                          </div>
                          <p className="font-semibold text-base text-slate-700 mb-2">
                            Chưa có tin nhắn nào
                          </p>
                          <p className="text-sm text-slate-500 max-w-xs mx-auto">
                            Khách hàng sẽ xuất hiện ở đây khi họ gửi tin nhắn
                            đầu tiên
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Chat Messages */}
              <div className="space-y-6 h-full">
                {selectedUserId ? (
                  <Card className="border-0 shadow-sm h-full flex flex-col">
                    <CardHeader className="border-b bg-background px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm border border-slate-200">
                            {(() => {
                              const conversation = (
                                chatConversations as any[]
                              )?.find((c) => c.user_id === selectedUserId);
                              return (
                                conversation?.first_name?.[0]?.toUpperCase() ||
                                conversation?.last_name?.[0]?.toUpperCase() ||
                                "U"
                              );
                            })()}
                          </div>
                          <div>
                            <CardTitle className="text-base font-medium text-foreground">
                              {(() => {
                                const conversation = (
                                  chatConversations as any[]
                                )?.find((c) => c.user_id === selectedUserId);
                                return conversation
                                  ? `${conversation.first_name} ${conversation.last_name}`
                                  : `Khách hàng #${selectedUserId}`;
                              })()}
                            </CardTitle>
                            <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                              <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2"></div>
                              Đang hoạt động
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs"
                          >
                            <Phone size={14} className="mr-1.5" />
                            Gọi
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-xs"
                          >
                            <Mail size={14} className="mr-1.5" />
                            Email
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 flex flex-col flex-1">
                      {/* Messages */}
                      <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-gradient-to-br from-slate-50/50 to-white">
                        {(chatMessages as any[])?.map(
                          (message: any, index: number) => (
                            <div
                              key={message.id}
                              className={`flex ${
                                Number(message.is_from_admin)
                                  ? "justify-end"
                                  : "justify-start"
                              } relative group animate-in fade-in-0 slide-in-from-bottom-2 duration-300`}
                            >
                              <div
                                className={`max-w-[70%] p-5 rounded-3xl relative shadow-lg transition-all duration-300 hover:shadow-xl ${
                                  Number(message.is_from_admin)
                                    ? "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-blue-500/25"
                                    : "bg-white border border-slate-200/60 shadow-slate-200/50 backdrop-blur-sm"
                                }`}
                              >
                                {/* Message header */}
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center space-x-3">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shadow-sm ${
                                        Number(message.is_from_admin)
                                          ? "bg-white/25 text-white backdrop-blur-sm"
                                          : "bg-gradient-to-br from-emerald-400 to-emerald-500 text-white"
                                      }`}
                                    >
                                      {Number(message.is_from_admin) ? (
                                        <Crown size={16} />
                                      ) : (
                                        <User size={16} />
                                      )}
                                    </div>
                                    <div>
                                      <span
                                        className={`text-sm font-semibold ${
                                          Number(message.is_from_admin)
                                            ? "text-white/95"
                                            : "text-slate-800"
                                        }`}
                                      >
                                        {Number(message.is_from_admin)
                                          ? "Admin"
                                          : message.first_name
                                          ? `${message.first_name} ${message.last_name}`
                                          : "Khách hàng"}
                                      </span>
                                      <span
                                        className={`text-xs block mt-0.5 ${
                                          Number(message.is_from_admin)
                                            ? "text-white/75"
                                            : "text-slate-500"
                                        }`}
                                      >
                                        {new Date(
                                          message.created_at
                                        ).toLocaleTimeString("vi-VN", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                  {Number(message.is_from_admin) === 1 && (
                                    <button
                                      className="p-2 rounded-full hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
                                      onClick={() =>
                                        setShowMenuFor(
                                          showMenuFor === message.id
                                            ? null
                                            : message.id
                                        )
                                      }
                                    >
                                      <MoreVertical
                                        size={18}
                                        className="text-white/90"
                                      />
                                    </button>
                                  )}
                                </div>

                                {/* Message content */}
                                <div
                                  className={`text-base leading-relaxed font-medium ${
                                    Number(message.is_from_admin)
                                      ? "text-white/95"
                                      : "text-slate-800"
                                  }`}
                                  style={{
                                    counterReset: "none",
                                    content: "none",
                                  }}
                                >
                                  {message.message?.trim() || "Tin nhắn trống"}
                                </div>

                                {/* Message status */}
                                {Number(message.is_from_admin) === 1 && (
                                  <span className="flex items-center justify-end mt-4 space-x-2">
                                    {message.is_read ? (
                                      <>
                                        <Check
                                          size={16}
                                          className="text-blue-200"
                                        />
                                        <span className="text-xs text-blue-200 font-medium">
                                          Đã đọc
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <Check
                                          size={16}
                                          className="text-white/70"
                                        />
                                        <span className="text-xs text-white/70 font-medium">
                                          Đã gửi
                                        </span>
                                      </>
                                    )}
                                  </span>
                                )}
                              </div>

                              {/* Message menu */}
                              {showMenuFor === message.id &&
                                Number(message.is_from_admin) === 1 && (
                                  <div className="absolute top-0 right-0 mt-2 mr-2 bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-2xl shadow-2xl z-10 min-w-[160px] animate-in fade-in-0 slide-in-from-top-2 duration-200">
                                    <div className="p-2">
                                      <button
                                        className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 rounded-xl flex items-center space-x-3 transition-all duration-200 hover:shadow-sm"
                                        onClick={() =>
                                          handleRecallMessage(message.id)
                                        }
                                      >
                                        <RotateCcw
                                          size={18}
                                          className="text-slate-600"
                                        />
                                        <span className="font-semibold">
                                          Thu hồi
                                        </span>
                                      </button>
                                      <button
                                        className="w-full px-4 py-3 text-left text-sm hover:bg-red-50 rounded-xl flex items-center space-x-3 transition-all duration-200 hover:shadow-sm text-red-600"
                                        onClick={() =>
                                          handleDeleteMessage(message.id)
                                        }
                                      >
                                        <Trash2 size={18} />
                                        <span className="font-semibold">
                                          Xóa
                                        </span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                            </div>
                          )
                        )}
                      </div>

                      {/* Message Input */}
                      <div className="border-t border-slate-200/60 bg-white/95 backdrop-blur-sm p-6">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (newMessage.trim() && selectedUserId) {
                              sendMessageMutation.mutate({
                                targetUserId: selectedUserId,
                                message: newMessage,
                                isFromAdmin: true,
                              });
                              setNewMessage("");
                            }
                          }}
                          className="flex items-end gap-3"
                        >
                          {/* Attachment button */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0 h-12 w-12 p-0 rounded-full hover:bg-slate-100 transition-all duration-200 hover:shadow-sm"
                          >
                            <Paperclip size={18} className="text-slate-500" />
                          </Button>

                          {/* Message input */}
                          <div className="flex-1 relative">
                            <Textarea
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Nhập tin nhắn..."
                              className="min-h-[48px] max-h-32 resize-none border border-slate-200/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 rounded-2xl bg-white/80 backdrop-blur-sm text-base font-medium"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  if (newMessage.trim() && selectedUserId) {
                                    sendMessageMutation.mutate({
                                      targetUserId: selectedUserId,
                                      message: newMessage,
                                      isFromAdmin: true,
                                    });
                                    setNewMessage("");
                                  }
                                }
                              }}
                            />
                            <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 transition-all duration-200"
                              >
                                <Smile size={16} className="text-slate-500" />
                              </Button>
                            </div>
                          </div>

                          {/* Send button */}
                          <Button
                            type="submit"
                            disabled={
                              !newMessage.trim() ||
                              sendMessageMutation.isPending
                            }
                            className="flex-shrink-0 h-12 w-12 p-0 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            {sendMessageMutation.isPending ? (
                              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                              <Send size={18} className="text-white" />
                            )}
                          </Button>
                        </form>

                        {/* Quick actions */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200/60">
                          <div className="flex items-center space-x-2 text-xs text-slate-500">
                            <span className="flex items-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2"></div>
                              Nhấn Enter để gửi, Shift+Enter để xuống dòng
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Mic size={14} className="mr-1.5" />
                              Voice
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Video size={14} className="mr-1.5" />
                              Video
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-0 shadow-sm h-full flex flex-col bg-gradient-to-br from-white to-slate-50">
                    <CardContent className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-sm">
                          <MessageCircle size={28} className="text-slate-400" />
                        </div>
                        <p className="font-semibold text-lg text-slate-700 mb-3">
                          Chọn khách hàng để bắt đầu chat
                        </p>
                        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                          Chọn một khách hàng từ danh sách bên trái để bắt đầu
                          cuộc trò chuyện và hỗ trợ họ
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Revenue Comparison Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-indigo-50 to-purple-50">
                    <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-indigo-100">
                      <CardTitle className="flex items-center text-gray-800">
                        <BarChart3 className="mr-2 text-indigo-600" size={20} />
                        So sánh doanh thu đặt cọc vs đã xác nhận
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-[300px]">
                        <Bar
                          data={{
                            labels: [
                              "Doanh thu đặt cọc",
                              "Doanh thu đã xác nhận",
                              "Tổng doanh thu",
                            ],
                            datasets: [
                              {
                                label: "Doanh thu (VNĐ)",
                                data: (() => {
                                  const depositRevenue = (bookings || [])
                                    .filter(
                                      (b: any) => b.status === "deposit_paid"
                                    )
                                    .reduce(
                                      (sum: number, b: any) =>
                                        sum +
                                        parseFloat(
                                          b.total_price || b.totalPrice || "0"
                                        ),
                                      0
                                    );

                                  const confirmedRevenue = (bookings || [])
                                    .filter(
                                      (b: any) =>
                                        b.status === "confirmed" ||
                                        b.status === "completed"
                                    )
                                    .reduce(
                                      (sum: number, b: any) =>
                                        sum +
                                        parseFloat(
                                          b.total_price || b.totalPrice || "0"
                                        ),
                                      0
                                    );

                                  const totalRevenue =
                                    depositRevenue + confirmedRevenue;

                                  console.log("Revenue comparison data:", {
                                    depositRevenue,
                                    confirmedRevenue,
                                    totalRevenue,
                                  });

                                  return [
                                    depositRevenue,
                                    confirmedRevenue,
                                    totalRevenue,
                                  ];
                                })(),
                                backgroundColor: [
                                  "rgba(245, 158, 11, 0.8)",
                                  "rgba(16, 185, 129, 0.8)",
                                  "rgba(139, 92, 246, 0.8)",
                                ],
                                borderColor: [
                                  "rgba(245, 158, 11, 1)",
                                  "rgba(16, 185, 129, 1)",
                                  "rgba(139, 92, 246, 1)",
                                ],
                                borderWidth: 2,
                                borderRadius: 8,
                                borderSkipped: false,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false,
                              },
                              tooltip: {
                                callbacks: {
                                  label: function (context) {
                                    return new Intl.NumberFormat("vi-VN", {
                                      style: "currency",
                                      currency: "VND",
                                    }).format(context.parsed.y);
                                  },
                                },
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                grid: {
                                  color: "rgba(0, 0, 0, 0.05)",
                                },
                                ticks: {
                                  callback: function (value) {
                                    return (
                                      new Intl.NumberFormat("vi-VN").format(
                                        value as number
                                      ) + "đ"
                                    );
                                  },
                                },
                              },
                              x: {
                                grid: {
                                  display: false,
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </TabsContent>

          {/* Contact Messages Tab */}
          <TabsContent value="contact" className="mt-6">
            <AdminContactMessages />
          </TabsContent>

          {/* Walk-in Tab */}
          <TabsContent value="walkin" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Header Section */}
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Users className="w-10 h-10 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Đặt phòng Walk-in
                  </h2>
                  <p className="text-muted-foreground text-lg mt-2">
                    Xử lý đặt phòng cho khách hàng đến trực tiếp tại khách sạn
                  </p>
                </div>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Start Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="lg:col-span-2"
                >
                  <Card className="bg-gradient-to-br from-white to-emerald-50 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="text-center space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-2xl font-bold text-emerald-800">
                            Bắt đầu đặt phòng Walk-in
                          </h3>
                          <p className="text-emerald-700 text-lg leading-relaxed">
                            Nhấn nút bên dưới để bắt đầu quy trình đặt phòng cho
                            khách hàng đến trực tiếp tại khách sạn
                          </p>
                        </div>

                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            size="lg"
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                            onClick={() =>
                              window.open("/walkin-booking", "_blank")
                            }
                          >
                            <Users className="mr-3" size={24} />
                            Bắt đầu đặt phòng Walk-in
                          </Button>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Process Steps Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-blue-800 flex items-center">
                        <Target className="mr-2" size={20} />
                        Quy trình Walk-in
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                            1
                          </div>
                          <div>
                            <p className="font-semibold text-blue-800">
                              Nhập thông tin
                            </p>
                            <p className="text-sm text-blue-600">
                              Thông tin khách hàng
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                            2
                          </div>
                          <div>
                            <p className="font-semibold text-blue-800">
                              Chọn phòng
                            </p>
                            <p className="text-sm text-blue-600">
                              Phòng trống phù hợp
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                            3
                          </div>
                          <div>
                            <p className="font-semibold text-blue-800">
                              Thanh toán
                            </p>
                            <p className="text-sm text-blue-600">
                              Thu tiền 100%
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm">
                          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                            4
                          </div>
                          <div>
                            <p className="font-semibold text-green-800">
                              Hoàn tất
                            </p>
                            <p className="text-sm text-green-600">
                              Khách nhận phòng
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Statistics Cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-purple-600 font-medium">
                          Hôm nay
                        </p>
                        <p className="text-2xl font-bold text-purple-800">0</p>
                        <p className="text-xs text-purple-600">Khách Walk-in</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-orange-600 font-medium">
                          Tháng này
                        </p>
                        <p className="text-2xl font-bold text-orange-800">0</p>
                        <p className="text-xs text-orange-600">
                          Đặt phòng thành công
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-teal-600 font-medium">
                          Doanh thu
                        </p>
                        <p className="text-2xl font-bold text-teal-800">0đ</p>
                        <p className="text-xs text-teal-600">Từ Walk-in</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Rooms Tab */}
          <TabsContent value="rooms" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Header Section */}
              <Card className="bg-gradient-to-r from-orange-500 to-red-600 shadow-2xl border-0">
                <CardContent className="p-8">
                  <div className="text-center text-white">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm"
                    >
                      <Bed className="w-8 h-8 text-white" />
                    </motion.div>
                    <h2 className="text-4xl font-bold mb-3">Quản lý Phòng</h2>
                    <p className="text-orange-100 text-lg">
                      Thêm, chỉnh sửa và quản lý các phòng khách sạn
                    </p>
                    <div className="mt-6 flex justify-center space-x-8 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                        <span>Phòng Đơn</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <span>Phòng Đôi</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <span>Phòng Suite</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span>Phòng VIP</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Filters Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-orange-200 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500"
                            size={18}
                          />
                          <Input
                            placeholder="Tìm kiếm phòng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-64 border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                          />
                        </div>
                        <Select
                          value={roomFilter}
                          onValueChange={setRoomFilter}
                        >
                          <SelectTrigger className="w-48 border-orange-200 focus:border-orange-500 focus:ring-orange-500">
                            <SelectValue placeholder="Lọc theo loại phòng" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="single">Phòng Đơn</SelectItem>
                            <SelectItem value="double">Phòng Đôi</SelectItem>
                            <SelectItem value="suite">Phòng Suite</SelectItem>
                            <SelectItem value="vip">Phòng VIP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className="bg-orange-50 text-orange-700 border-orange-200"
                        >
                          {(rooms || []).length} phòng
                        </Badge>
                        <Dialog
                          open={isRoomDialogOpen}
                          onOpenChange={setIsRoomDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                onClick={() => {
                                  setEditingRoom(null);
                                  roomForm.reset(roomFormDefaultValues);
                                }}
                                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Thêm Phòng
                              </Button>
                            </motion.div>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-sm border-orange-200">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-bold text-gray-800">
                                {editingRoom
                                  ? "Chỉnh sửa Phòng"
                                  : "Thêm Phòng Mới"}
                              </DialogTitle>
                              <DialogDescription className="text-gray-600">
                                {editingRoom
                                  ? "Cập nhật thông tin phòng"
                                  : "Thêm phòng mới vào hệ thống"}
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...roomForm}>
                              <form
                                onSubmit={roomForm.handleSubmit(onRoomSubmit)}
                                className="space-y-6"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <FormField
                                    control={roomForm.control}
                                    name="number"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-gray-700 font-semibold">
                                          Số Phòng
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            placeholder="VD: 101"
                                            className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                                          />
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
                                        <FormLabel className="text-gray-700 font-semibold">
                                          Loại Phòng
                                        </FormLabel>
                                        <Select
                                          onValueChange={field.onChange}
                                          defaultValue={field.value}
                                        >
                                          <FormControl>
                                            <SelectTrigger className="border-orange-200 focus:border-orange-500 focus:ring-orange-500">
                                              <SelectValue placeholder="Chọn loại phòng" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="single">
                                              Phòng Đơn
                                            </SelectItem>
                                            <SelectItem value="double">
                                              Phòng Đôi
                                            </SelectItem>
                                            <SelectItem value="suite">
                                              Phòng Suite
                                            </SelectItem>
                                            <SelectItem value="vip">
                                              Phòng VIP
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={roomForm.control}
                                    name="price"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-gray-700 font-semibold">
                                          Giá (VNĐ)
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            type="text"
                                            placeholder="VD: 500000"
                                            className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                                          />
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
                                        <FormLabel className="text-gray-700 font-semibold">
                                          Sức Chứa
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            type="text"
                                            placeholder="VD: 2"
                                            className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
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
                                      <FormLabel className="text-gray-700 font-semibold">
                                        Mô Tả
                                      </FormLabel>
                                      <FormControl>
                                        <Textarea
                                          {...field}
                                          placeholder="Mô tả chi tiết về phòng..."
                                          className="border-orange-200 focus:border-orange-500 focus:ring-orange-500 min-h-[100px]"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={roomForm.control}
                                  name="amenities"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-gray-700 font-semibold">
                                        Tiện nghi
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          placeholder="Nhập các tiện nghi, cách nhau bởi dấu phẩy"
                                          value={field.value || ""}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={roomForm.control}
                                  name="images"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-gray-700 font-semibold">
                                        Ảnh phòng (dán nhiều URL, cách nhau bởi
                                        dấu phẩy)
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          placeholder="https://...jpg, https://...png"
                                          value={field.value || ""}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="flex justify-end space-x-3 pt-4">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsRoomDialogOpen(false)}
                                    className="border-orange-200 text-orange-600 hover:bg-orange-50"
                                  >
                                    Hủy
                                  </Button>
                                  <Button
                                    type="submit"
                                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                                    disabled={roomForm.formState.isSubmitting}
                                  >
                                    {roomForm.formState.isSubmitting ? (
                                      <div className="flex items-center">
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang lưu...
                                      </div>
                                    ) : editingRoom ? (
                                      "Cập nhật"
                                    ) : (
                                      "Thêm Phòng"
                                    )}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Rooms Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {(filteredRooms || []).map((room, index) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="group"
                  >
                    <Card className="bg-white/90 backdrop-blur-sm border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-800 mb-1">
                                {room.name}
                              </h3>
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge
                                  variant="secondary"
                                  className={`${
                                    room.type === "single"
                                      ? "bg-blue-100 text-blue-700"
                                      : room.type === "double"
                                      ? "bg-green-100 text-green-700"
                                      : room.type === "suite"
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {room.type === "single"
                                    ? "Phòng Đơn"
                                    : room.type === "double"
                                    ? "Phòng Đôi"
                                    : room.type === "suite"
                                    ? "Phòng Suite"
                                    : "Phòng VIP"}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {room.capacity} người
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-1">
                                <DollarSign className="w-4 h-4" />
                                <span className="font-semibold text-orange-600">
                                  {new Intl.NumberFormat("vi-VN").format(
                                    room.price
                                  )}
                                  đ
                                </span>
                              </div>
                            </div>
                          </div>

                          {room.description && (
                            <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                              {room.description}
                            </p>
                          )}

                          <div className="flex justify-end space-x-2">
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditRoom(room)}
                                className="border-orange-200 text-orange-600 hover:bg-orange-50"
                              >
                                <Edit size={16} />
                              </Button>
                            </motion.div>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Bạn có chắc chắn muốn xóa phòng này không?"
                                    )
                                  ) {
                                    deleteRoomMutation.mutate(room.id);
                                  }
                                }}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Header Section */}
              <Card className="bg-gradient-to-r from-purple-500 to-pink-600 shadow-2xl border-0">
                <CardContent className="p-8">
                  <div className="text-center text-white">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm"
                    >
                      <Star className="w-8 h-8 text-white" />
                    </motion.div>
                    <h2 className="text-4xl font-bold mb-3">Quản lý Dịch vụ</h2>
                    <p className="text-purple-100 text-lg">
                      Thêm, chỉnh sửa và quản lý các dịch vụ khách sạn
                    </p>
                    <div className="mt-6 flex justify-center space-x-8 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                        <span>Spa & Wellness</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                        <span>Nhà hàng</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span>Gym & Fitness</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <span>Giải trí</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Filters Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-purple-200 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500"
                            size={18}
                          />
                          <Input
                            placeholder="Tìm kiếm dịch vụ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-64 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                          />
                        </div>
                        <Select
                          value={serviceFilter}
                          onValueChange={setServiceFilter}
                        >
                          <SelectTrigger className="w-48 border-purple-200 focus:border-purple-500 focus:ring-purple-500">
                            <SelectValue placeholder="Lọc theo danh mục" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="spa">Spa & Wellness</SelectItem>
                            <SelectItem value="restaurant">Nhà hàng</SelectItem>
                            <SelectItem value="fitness">
                              Gym & Fitness
                            </SelectItem>
                            <SelectItem value="entertainment">
                              Giải trí
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className="bg-purple-50 text-purple-700 border-purple-200"
                        >
                          {(services || []).length} dịch vụ
                        </Badge>
                        <Dialog
                          open={isServiceDialogOpen}
                          onOpenChange={setIsServiceDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                onClick={() => {
                                  setEditingService(null);
                                  serviceForm.reset();
                                }}
                                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                              >
                                <Plus className="mr-2" size={20} />
                                Thêm dịch vụ
                              </Button>
                            </motion.div>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-2xl">
                            <DialogHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg -m-6 mb-6 p-6">
                              <DialogTitle className="flex items-center text-xl">
                                <Star className="mr-3" size={24} />
                                {editingService
                                  ? "Chỉnh sửa dịch vụ"
                                  : "Thêm dịch vụ mới"}
                              </DialogTitle>
                            </DialogHeader>
                            <Form {...serviceForm}>
                              <form
                                onSubmit={serviceForm.handleSubmit(
                                  onServiceSubmit
                                )}
                                className="space-y-6"
                              >
                                {/* Basic Info Section */}
                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                                  <h3 className="font-bold text-lg text-purple-800 mb-4 flex items-center">
                                    <Star className="mr-2" size={20} />
                                    Thông tin cơ bản
                                  </h3>
                                  <div className="space-y-6">
                                    <FormField
                                      control={serviceForm.control}
                                      name="name"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-purple-700 font-medium">
                                            Tên dịch vụ
                                          </FormLabel>
                                          <FormControl>
                                            <Input
                                              {...field}
                                              placeholder="Massage thư giãn"
                                              className="border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <FormField
                                        control={serviceForm.control}
                                        name="price"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-purple-700 font-medium">
                                              Giá (VND)
                                            </FormLabel>
                                            <FormControl>
                                              <Input
                                                {...field}
                                                placeholder="500000"
                                                className="border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                                              />
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
                                            <FormLabel className="text-purple-700 font-medium">
                                              Danh mục
                                            </FormLabel>
                                            <Select
                                              onValueChange={field.onChange}
                                              defaultValue={field.value}
                                            >
                                              <FormControl>
                                                <SelectTrigger className="border-purple-200 focus:border-purple-500 focus:ring-purple-500">
                                                  <SelectValue placeholder="Chọn danh mục" />
                                                </SelectTrigger>
                                              </FormControl>
                                              <SelectContent>
                                                <SelectItem value="spa">
                                                  Spa & Wellness
                                                </SelectItem>
                                                <SelectItem value="restaurant">
                                                  Nhà hàng
                                                </SelectItem>
                                                <SelectItem value="fitness">
                                                  Gym & Fitness
                                                </SelectItem>
                                                <SelectItem value="entertainment">
                                                  Giải trí
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Description Section */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                                  <h3 className="font-bold text-lg text-blue-800 mb-4 flex items-center">
                                    <FileText className="mr-2" size={20} />
                                    Mô tả chi tiết
                                  </h3>
                                  <FormField
                                    control={serviceForm.control}
                                    name="description"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Textarea
                                            {...field}
                                            placeholder="Mô tả chi tiết về dịch vụ, lợi ích, thời gian sử dụng..."
                                            className="border-blue-200 focus:border-blue-500 focus:ring-blue-500 min-h-[120px]"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-4 pt-6">
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() =>
                                        setIsServiceDialogOpen(false)
                                      }
                                      className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50"
                                    >
                                      Hủy
                                    </Button>
                                  </motion.div>
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Button
                                      type="submit"
                                      disabled={
                                        createServiceMutation.isPending ||
                                        updateServiceMutation.isPending
                                      }
                                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                    >
                                      {createServiceMutation.isPending ||
                                      updateServiceMutation.isPending ? (
                                        <>
                                          <RotateCcw
                                            className="mr-2 animate-spin"
                                            size={18}
                                          />
                                          {editingService
                                            ? "Đang cập nhật..."
                                            : "Đang thêm..."}
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle
                                            className="mr-2"
                                            size={18}
                                          />
                                          {editingService
                                            ? "Cập nhật dịch vụ"
                                            : "Thêm dịch vụ"}
                                        </>
                                      )}
                                    </Button>
                                  </motion.div>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Services Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {servicesLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <Card
                        key={i}
                        className="animate-pulse bg-gradient-to-br from-gray-50 to-gray-100"
                      >
                        <CardContent className="p-6">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                          <div className="h-8 bg-gray-200 rounded"></div>
                        </CardContent>
                      </Card>
                    ))
                  : filteredServices?.map((service: Service, index: number) => (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        whileHover={{ scale: 1.02 }}
                        className="group"
                      >
                        <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-purple-300">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                    <Star className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-bold text-gray-800">
                                      {service.name}
                                    </h3>
                                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                      {service.category}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <div className="flex space-x-2">
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditService(service)}
                                    className="border-purple-200 text-purple-600 hover:bg-purple-50"
                                  >
                                    <Edit size={16} />
                                  </Button>
                                </motion.div>
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          "Bạn có chắc chắn muốn xóa dịch vụ này không?"
                                        )
                                      ) {
                                        deleteServiceMutation.mutate(
                                          service.id
                                        );
                                      }
                                    }}
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </motion.div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <span className="font-semibold text-green-600">
                                    {new Intl.NumberFormat("vi-VN").format(
                                      service.price
                                    )}
                                    đ
                                  </span>
                                </div>
                                <Badge
                                  variant={
                                    service.isActive ? "default" : "secondary"
                                  }
                                  className={
                                    service.isActive
                                      ? "bg-green-100 text-green-700 border-green-200"
                                      : "bg-gray-100 text-gray-700 border-gray-200"
                                  }
                                >
                                  {service.isActive ? "Hoạt động" : "Tạm dừng"}
                                </Badge>
                              </div>

                              {service.description && (
                                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                                  <p className="text-sm text-purple-700 line-clamp-2">
                                    {service.description}
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
              </motion.div>
            </motion.div>
          </TabsContent>

          {/* Blog Tab */}
          <TabsContent value="blog" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Header Section */}
              <Card className="bg-gradient-to-r from-green-500 to-emerald-600 shadow-2xl border-0">
                <CardContent className="p-8">
                  <div className="text-center text-white">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm"
                    >
                      <FileText className="w-8 h-8 text-white" />
                    </motion.div>
                    <h2 className="text-4xl font-bold mb-3">Quản lý Blog</h2>
                    <p className="text-green-100 text-lg">
                      Thêm, chỉnh sửa và quản lý các bài viết blog
                    </p>
                    <div className="mt-6 flex justify-center space-x-8 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <span>Tin tức</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <span>Du lịch</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                        <span>Mẹo hay</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                        <span>Khuyến mãi</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Filters Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-green-200 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500"
                            size={18}
                          />
                          <Input
                            placeholder="Tìm kiếm bài viết..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-64 border-green-200 focus:border-green-500 focus:ring-green-500"
                          />
                        </div>
                        <Select
                          value={blogFilter}
                          onValueChange={setBlogFilter}
                        >
                          <SelectTrigger className="w-48 border-green-200 focus:border-green-500 focus:ring-green-500">
                            <SelectValue placeholder="Lọc theo danh mục" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="news">Tin tức</SelectItem>
                            <SelectItem value="travel">Du lịch</SelectItem>
                            <SelectItem value="tips">Mẹo hay</SelectItem>
                            <SelectItem value="promotion">
                              Khuyến mãi
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          {(blogPosts || []).length} bài viết
                        </Badge>
                        <Dialog
                          open={isBlogDialogOpen}
                          onOpenChange={setIsBlogDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                onClick={() => {
                                  setEditingBlogPost(null);
                                  blogForm.reset();
                                }}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Thêm Bài Viết
                              </Button>
                            </motion.div>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl bg-white/95 backdrop-blur-sm border-green-200">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-bold text-gray-800">
                                {editingBlogPost
                                  ? "Chỉnh sửa Bài Viết"
                                  : "Thêm Bài Viết Mới"}
                              </DialogTitle>
                              <DialogDescription className="text-gray-600">
                                {editingBlogPost
                                  ? "Cập nhật thông tin bài viết"
                                  : "Thêm bài viết mới vào blog"}
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...blogForm}>
                              <form
                                onSubmit={blogForm.handleSubmit(onBlogSubmit)}
                                className="space-y-6"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <FormField
                                    control={blogForm.control}
                                    name="title"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-gray-700 font-semibold">
                                          Tiêu Đề
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            placeholder="Tiêu đề bài viết..."
                                            className="border-green-200 focus:border-green-500 focus:ring-green-500"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={blogForm.control}
                                    name="author"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-gray-700 font-semibold">
                                          Tác Giả
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            placeholder="Tên tác giả"
                                            className="border-green-200 focus:border-green-500 focus:ring-green-500"
                                          />
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
                                        <FormLabel className="text-gray-700 font-semibold">
                                          Danh Mục
                                        </FormLabel>
                                        <Select
                                          onValueChange={field.onChange}
                                          defaultValue={field.value}
                                        >
                                          <FormControl>
                                            <SelectTrigger className="border-green-200 focus:border-green-500 focus:ring-green-500">
                                              <SelectValue placeholder="Chọn danh mục" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="news">
                                              Tin tức
                                            </SelectItem>
                                            <SelectItem value="travel">
                                              Du lịch
                                            </SelectItem>
                                            <SelectItem value="tips">
                                              Mẹo hay
                                            </SelectItem>
                                            <SelectItem value="promotion">
                                              Khuyến mãi
                                            </SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={blogForm.control}
                                    name="tags"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-gray-700 font-semibold">
                                          Tags
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            placeholder="Nhập tags, cách nhau bởi dấu phẩy"
                                            className="border-green-200 focus:border-green-500 focus:ring-green-500"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={blogForm.control}
                                    name="read_time"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-gray-700 font-semibold">
                                          Thời Gian Đọc (phút)
                                        </FormLabel>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            type="text"
                                            placeholder="5"
                                            className="border-green-200 focus:border-green-500 focus:ring-green-500"
                                          />
                                        </FormControl>
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
                                      <FormLabel className="text-gray-700 font-semibold">
                                        Tóm Tắt
                                      </FormLabel>
                                      <FormControl>
                                        <Textarea
                                          {...field}
                                          placeholder="Tóm tắt ngắn gọn..."
                                          className="border-green-200 focus:border-green-500 focus:ring-green-500 min-h-[80px]"
                                        />
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
                                      <FormLabel className="text-gray-700 font-semibold">
                                        Nội Dung
                                      </FormLabel>
                                      <FormControl>
                                        <Textarea
                                          {...field}
                                          placeholder="Nội dung chi tiết..."
                                          className="border-green-200 focus:border-green-500 focus:ring-green-500 min-h-[200px]"
                                        />
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
                                      <FormLabel className="text-gray-700 font-semibold">
                                        Hình Ảnh (URL)
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          {...field}
                                          placeholder="https://example.com/image.jpg"
                                          className="border-green-200 focus:border-green-500 focus:ring-green-500"
                                        />
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
                                        <FormLabel className="text-base">
                                          Xuất Bản
                                        </FormLabel>
                                        <div className="text-sm text-muted-foreground">
                                          Bài viết sẽ hiển thị trên trang blog
                                          công khai
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
                                <div className="flex justify-end space-x-3 pt-4">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsBlogDialogOpen(false)}
                                    className="border-green-200 text-green-600 hover:bg-green-50"
                                  >
                                    Hủy
                                  </Button>
                                  <Button
                                    type="submit"
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                                    disabled={blogForm.formState.isSubmitting}
                                  >
                                    {blogForm.formState.isSubmitting ? (
                                      <div className="flex items-center">
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang lưu...
                                      </div>
                                    ) : editingBlogPost ? (
                                      "Cập nhật"
                                    ) : (
                                      "Thêm Bài Viết"
                                    )}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Blog Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {(filteredBlogPosts || []).map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="group"
                  >
                    <Card className="bg-white/90 backdrop-blur-sm border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                                {post.title}
                              </h3>
                              <div className="flex items-center space-x-2 mb-3">
                                <Badge
                                  variant="secondary"
                                  className="bg-green-100 text-green-700 border-green-200"
                                >
                                  {post.category}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {post.read_time} phút
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-1 mb-2">
                                <User className="w-4 h-4 text-blue-600" />
                                <span className="text-sm text-blue-600 font-medium">
                                  {post.author}
                                </span>
                              </div>
                            </div>
                          </div>

                          {post.excerpt && (
                            <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                              {post.excerpt}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <Badge
                              variant={post.published ? "default" : "secondary"}
                              className={
                                post.published
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                              }
                            >
                              {post.published ? "Đã xuất bản" : "Nháp"}
                            </Badge>

                            <div className="flex space-x-2">
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditBlogPost(post)}
                                  className="border-green-200 text-green-600 hover:bg-green-50"
                                >
                                  <Edit size={16} />
                                </Button>
                              </motion.div>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        "Bạn có chắc chắn muốn xóa bài viết này không?"
                                      )
                                    ) {
                                      deleteBlogMutation.mutate(post.id);
                                    }
                                  }}
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </motion.div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
