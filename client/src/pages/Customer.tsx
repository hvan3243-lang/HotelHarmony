import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useToast } from "@/hooks/use-toast";
import { authManager } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Award,
  Bed,
  Calendar,
  Clock,
  CreditCard,
  Crown,
  Edit,
  Eye,
  Heart,
  Mail,
  MapPin,
  Phone,
  Plus,
  Star,
  TrendingUp,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
// Define types locally to avoid import issues
type UserType = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
  preferences?: string | string[];
  isVip?: boolean;
  createdAt?: Date;
};

type Room = {
  id: number;
  number: string;
  type: string;
  price: number;
  amenities?: string | string[];
  description?: string;
  status?: string;
};

type Booking = {
  id: number;
  userId: number;
  user_id?: number;
  roomId: number;
  room_id?: number;
  checkIn: string;
  checkOut: string;
  check_in?: string;
  check_out?: string;
  guests: number;
  totalPrice: string;
  total_price?: string;
  status: string;
  depositAmount?: string;
  deposit_amount?: string;
  remainingAmount?: string;
  remaining_amount?: string;
  specialRequests?: string;
  checkInTime?: string;
  check_in_time?: string;
  checkOutTime?: string;
  check_out_time?: string;
  room: Room;
};

export default function Customer() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserType | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    preferences: [] as string[],
  });

  useEffect(() => {
    const currentUser = authManager.getUser();
    if (!currentUser) {
      setLocation("/auth");
      return;
    }
    setUser(currentUser);
    setProfileForm({
      firstName: currentUser.firstName || "",
      lastName: currentUser.lastName || "",
      phone: currentUser.phone || "",
      preferences: Array.isArray(currentUser.preferences)
        ? currentUser.preferences
        : JSON.parse(currentUser.preferences || "[]"),
    });
  }, [setLocation]);

  // Cập nhật profileForm khi user thay đổi
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        preferences: Array.isArray(user.preferences)
          ? user.preferences
          : JSON.parse(user.preferences || "[]"),
      });
    }
  }, [user]);

  const {
    data: bookings = [],
    isLoading: bookingsLoading,
    error: bookingsError,
  } = useQuery({
    queryKey: ["/api/bookings"],
    enabled: !!user,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  }) as { data: Booking[]; isLoading: boolean; error: any };

  // Debug logs
  console.log("Debug - Customer page bookings:", bookings);
  console.log("Debug - User ID:", user?.id);
  console.log("Debug - Bookings loading:", bookingsLoading);
  console.log("Debug - Bookings error:", bookingsError);

  const filteredBookings = bookings.filter((booking: Booking) => {
    if (statusFilter === "all") return true;
    return booking.status === statusFilter;
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const response = await apiRequest(
        "PUT",
        `/api/bookings/${bookingId}/cancel`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Hủy đặt phòng thành công",
        description: "Đặt phòng đã được hủy thành công",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi hủy đặt phòng",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await apiRequest(
        "PUT",
        `/api/users/profile`,
        profileData
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: (updatedUser) => {
      console.log("Debug - Updated user data:", updatedUser);

      toast({
        title: "Cập nhật thành công",
        description: "Thông tin cá nhân đã được cập nhật",
      });

      // Chuyển đổi format từ snake_case sang camelCase
      const convertedUser = {
        ...updatedUser,
        firstName: updatedUser.first_name || updatedUser.firstName,
        lastName: updatedUser.last_name || updatedUser.lastName,
        phone: updatedUser.phone,
        email: updatedUser.email,
        preferences: updatedUser.preferences,
        isVip: updatedUser.is_vip || updatedUser.isVip,
        createdAt:
          updatedUser.created_at || updatedUser.createdAt
            ? new Date(updatedUser.created_at || updatedUser.createdAt)
            : undefined,
      };

      console.log("Debug - Converted user data:", convertedUser);

      // Cập nhật cả state và authManager
      setUser(convertedUser);
      authManager.setUser(convertedUser);

      setEditingProfile(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi cập nhật",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mock recommendations data
  const recommendations = [
    {
      type: "deluxe",
      amenities: ["WiFi", "Mini bar", "Ocean view"],
    },
  ];

  const preferences = [
    "ocean_view",
    "mountain_view",
    "city_view",
    "quiet_room",
    "high_floor",
    "low_floor",
    "accessible",
    "connecting_rooms",
  ];

  const handleRebookRoom = (room: Room) => {
    localStorage.setItem("selectedRoom", JSON.stringify(room));
    setLocation("/booking");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Đang chờ",
          variant: "secondary",
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
      case "deposit_paid":
        return {
          label: "Đã đặt cọc",
          variant: "secondary",
          color: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case "confirmed":
        return {
          label: "Đã xác nhận",
          variant: "secondary",
          color: "bg-green-100 text-green-800 border-green-200",
        };
      case "completed":
        return {
          label: "Đã hoàn thành",
          variant: "secondary",
          color: "bg-purple-100 text-purple-800 border-purple-200",
        };
      case "cancelled":
        return {
          label: "Đã hủy",
          variant: "destructive",
          color: "bg-red-100 text-red-800 border-red-200",
        };
      default:
        return {
          label: status,
          variant: "secondary",
          color: "bg-gray-100 text-gray-800 border-gray-200",
        };
    }
  };

  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case "standard":
        return "Phòng Tiêu Chuẩn";
      case "deluxe":
        return "Phòng Deluxe";
      case "suite":
        return "Phòng Suite";
      case "presidential":
        return "Phòng Tổng Thống";
      default:
        return type;
    }
  };

  const formatPrice = (price: string | number) => {
    if (!price || isNaN(Number(price))) return "0đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(price));
  };

  const formatDate = (date: string) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "N/A";
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();

    // Chuyển đổi dữ liệu để phù hợp với API
    const updateData = {
      first_name: profileForm.firstName,
      last_name: profileForm.lastName,
      phone: profileForm.phone,
      preferences: JSON.stringify(profileForm.preferences),
    };

    updateProfileMutation.mutate(updateData);
  };

  const handlePreferenceChange = (preference: string, checked: boolean) => {
    setProfileForm((prev) => ({
      ...prev,
      preferences: checked
        ? [...prev.preferences, preference]
        : prev.preferences.filter((p) => p !== preference),
    }));
  };

  if (!user) {
    return null;
  }

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(
    (b: Booking) => b.status === "completed"
  ).length;
  const pendingBookings = bookings.filter(
    (b: Booking) => b.status === "pending"
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Customer Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="shadow-xl border-0 bg-gradient-to-r from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      {user.firstName?.[0] || ""}
                      {user.lastName?.[0] || ""}
                    </div>
                    {user.isVip && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <Crown size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      {user.firstName || ""} {user.lastName || ""}
                    </h1>
                    <p className="text-gray-600 mb-3 flex items-center">
                      <Mail size={16} className="mr-2" />
                      {user.email}
                    </p>
                    <div className="flex items-center space-x-3">
                      {user.isVip && (
                        <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-md">
                          <Crown size={14} className="mr-1" />
                          {t("customer.vip")}
                        </Badge>
                      )}
                      <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-md">
                        <Award size={14} className="mr-1" />
                        {totalBookings} {t("customer.totalBookings")}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-lg">
                      <Edit size={16} className="mr-2" />
                      {t("customer.editProfile")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        {t("customer.updateProfile")}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label
                            htmlFor="firstName"
                            className="text-sm font-medium text-gray-700"
                          >
                            Họ
                          </Label>
                          <Input
                            id="firstName"
                            value={profileForm.firstName}
                            onChange={(e) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                firstName: e.target.value,
                              }))
                            }
                            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="lastName"
                            className="text-sm font-medium text-gray-700"
                          >
                            Tên
                          </Label>
                          <Input
                            id="lastName"
                            value={profileForm.lastName}
                            onChange={(e) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                lastName: e.target.value,
                              }))
                            }
                            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div>
                        <Label
                          htmlFor="phone"
                          className="text-sm font-medium text-gray-700"
                        >
                          Số điện thoại
                        </Label>
                        <Input
                          id="phone"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <Label className="text-base font-medium text-gray-700">
                          Sở thích
                        </Label>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          {preferences.map((preference) => (
                            <div
                              key={preference}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={preference}
                                checked={profileForm.preferences.includes(
                                  preference
                                )}
                                onCheckedChange={(checked) =>
                                  handlePreferenceChange(preference, !!checked)
                                }
                                className="text-blue-500"
                              />
                              <Label
                                htmlFor={preference}
                                className="text-sm capitalize text-gray-600"
                              >
                                {preference}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditingProfile(false)}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Hủy
                        </Button>
                        <Button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0"
                        >
                          {updateProfileMutation.isPending
                            ? "Đang lưu..."
                            : "Lưu thay đổi"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-blue-100">
                  <CardTitle className="flex items-center text-gray-800">
                    <User className="mr-2 text-blue-600" size={20} />
                    Thông tin cá nhân
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50/50">
                    <Phone size={16} className="text-blue-600" />
                    <span className="text-gray-700">
                      {user.phone || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50/50">
                    <Mail size={16} className="text-blue-600" />
                    <span className="text-gray-700">{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50/50">
                    <Calendar size={16} className="text-blue-600" />
                    <span className="text-gray-700">
                      Tham gia{" "}
                      {user.createdAt ? formatDate(user.createdAt) : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50/50">
                    <Bed size={16} className="text-blue-600" />
                    <span className="text-gray-700">
                      {completedBookings} lần nghỉ dưỡng
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Statistics */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-green-100">
                  <CardTitle className="flex items-center text-gray-800">
                    <TrendingUp className="mr-2 text-green-600" size={20} />
                    Thống kê
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-lg bg-white/60">
                      <div className="text-2xl font-bold text-green-600">
                        {totalBookings}
                      </div>
                      <div className="text-sm text-gray-600">
                        Tổng đặt phòng
                      </div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-white/60">
                      <div className="text-2xl font-bold text-blue-600">
                        {completedBookings}
                      </div>
                      <div className="text-sm text-gray-600">Đã hoàn thành</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-white/60">
                      <div className="text-2xl font-bold text-yellow-600">
                        {pendingBookings}
                      </div>
                      <div className="text-sm text-gray-600">Đang chờ</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-white/60">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatPrice(
                          bookings.reduce(
                            (sum: number, b: any) =>
                              sum +
                              parseFloat(b.totalPrice || b.total_price || "0"),
                            0
                          )
                        )}
                      </div>
                      <div className="text-sm text-gray-600">Tổng chi tiêu</div>
                    </div>
                  </div>

                  {/* Thêm nút chỉnh sửa thông tin chi tiết */}
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <Button
                      onClick={() => setEditingProfile(true)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-md"
                    >
                      <Edit size={16} className="mr-2" />
                      Chỉnh sửa thông tin
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Preferences */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-purple-100">
                  <CardTitle className="flex items-center text-gray-800">
                    <Heart className="mr-2 text-purple-600" size={20} />
                    Sở thích
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {user.preferences &&
                  (Array.isArray(user.preferences)
                    ? user.preferences
                    : JSON.parse(user.preferences || "[]")
                  ).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(user.preferences)
                        ? user.preferences
                        : JSON.parse(user.preferences || "[]")
                      ).map((pref, index) => (
                        <Badge
                          key={index}
                          className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200"
                        >
                          {pref}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Chưa thiết lập sở thích
                    </p>
                  )}
                  <Button
                    variant="outline"
                    className="w-full mt-4 border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={() => setEditingProfile(true)}
                  >
                    <Edit size={16} className="mr-2" />
                    Cập nhật sở thích
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Booking History */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border-b border-indigo-100">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center text-gray-800">
                      <Calendar className="mr-2 text-indigo-600" size={20} />
                      Lịch sử đặt phòng
                    </CardTitle>
                    <div className="flex space-x-3">
                      <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                      >
                        <SelectTrigger className="w-40 border-indigo-200 focus:border-indigo-500">
                          <SelectValue placeholder="Tất cả" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="pending">Đang chờ</SelectItem>
                          <SelectItem value="deposit_paid">
                            Đã đặt cọc
                          </SelectItem>
                          <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                          <SelectItem value="completed">
                            Đã hoàn thành
                          </SelectItem>
                          <SelectItem value="cancelled">Đã hủy</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => setLocation("/booking")}
                        className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white border-0 shadow-lg"
                      >
                        <Plus size={16} className="mr-2" />
                        Đặt phòng mới
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {bookingsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : filteredBookings.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Calendar className="text-gray-400" size={48} />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-700">
                        {statusFilter
                          ? "Không có đặt phòng nào"
                          : "Chưa có đặt phòng"}
                      </h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        {statusFilter
                          ? "Không tìm thấy đặt phòng với trạng thái này"
                          : "Hãy bắt đầu đặt phòng đầu tiên của bạn và trải nghiệm dịch vụ tuyệt vời"}
                      </p>
                      <Button
                        onClick={() => setLocation("/booking")}
                        className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white border-0 shadow-lg"
                      >
                        Đặt phòng ngay
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {filteredBookings.map(
                        (booking: Booking & { room: Room }, index) => {
                          console.log("Debug - Rendering booking:", {
                            id: booking.id,
                            status: booking.status,
                            user_id: booking.user_id,
                            room: booking.room,
                          });
                          const statusInfo = getStatusBadge(booking.status);
                          return (
                            <motion.div
                              key={booking.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-r from-white to-gray-50/50">
                                <CardContent className="p-6">
                                  <div className="flex justify-between items-start mb-6">
                                    <div>
                                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                                        {getRoomTypeLabel(booking.room.type)}
                                      </h3>
                                      <p className="text-gray-500 flex items-center">
                                        <CreditCard
                                          size={14}
                                          className="mr-1"
                                        />
                                        Mã đặt phòng: #HLX{booking.id}
                                      </p>
                                    </div>
                                    <Badge
                                      className={`${statusInfo.color} shadow-md`}
                                    >
                                      {statusInfo.label}
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                                    <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100">
                                      <Label className="text-sm text-gray-600 flex items-center mb-2">
                                        <Calendar size={14} className="mr-1" />
                                        Check-in
                                      </Label>
                                      <p className="font-semibold text-gray-800">
                                        {formatDate(
                                          booking.check_in || booking.checkIn
                                        )}
                                      </p>
                                      {(booking.check_in_time ||
                                        booking.checkInTime) && (
                                        <p className="text-sm text-gray-500 mt-1">
                                          <Clock
                                            size={12}
                                            className="inline mr-1"
                                          />
                                          {booking.check_in_time ||
                                            booking.checkInTime}
                                        </p>
                                      )}
                                    </div>
                                    <div className="p-4 rounded-lg bg-green-50/50 border border-green-100">
                                      <Label className="text-sm text-gray-600 flex items-center mb-2">
                                        <Calendar size={14} className="mr-1" />
                                        Check-out
                                      </Label>
                                      <p className="font-semibold text-gray-800">
                                        {formatDate(
                                          booking.check_out || booking.checkOut
                                        )}
                                      </p>
                                      {(booking.check_out_time ||
                                        booking.checkOutTime) && (
                                        <p className="text-sm text-gray-500 mt-1">
                                          <Clock
                                            size={12}
                                            className="inline mr-1"
                                          />
                                          {booking.check_out_time ||
                                            booking.checkOutTime}
                                        </p>
                                      )}
                                    </div>
                                    <div className="p-4 rounded-lg bg-purple-50/50 border border-purple-100">
                                      <Label className="text-sm text-gray-600 flex items-center mb-2">
                                        <Users size={14} className="mr-1" />
                                        Khách
                                      </Label>
                                      <p className="font-semibold text-gray-800 flex items-center">
                                        <Users size={16} className="mr-1" />
                                        {booking.guests}
                                      </p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-100">
                                      <Label className="text-sm text-gray-600 flex items-center mb-2">
                                        <CreditCard
                                          size={14}
                                          className="mr-1"
                                        />
                                        Tổng tiền
                                      </Label>
                                      <p className="font-bold text-lg text-amber-700">
                                        {formatPrice(
                                          booking.total_price ||
                                            booking.totalPrice
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex justify-between items-center">
                                    <div className="text-sm text-gray-500 flex items-center">
                                      <MapPin size={14} className="mr-1" />
                                      Phòng {booking.room.number} •{" "}
                                      {(Array.isArray(booking.room.amenities)
                                        ? booking.room.amenities
                                        : JSON.parse(
                                            booking.room.amenities || "[]"
                                          )
                                      )
                                        .slice(0, 2)
                                        .join(", ")}
                                    </div>
                                    <div className="flex space-x-3">
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                          >
                                            <Eye size={14} className="mr-1" />
                                            Chi tiết
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
                                          <DialogHeader>
                                            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                              Chi tiết đặt phòng #HLX
                                              {booking.id}
                                            </DialogTitle>
                                          </DialogHeader>
                                          <div className="space-y-6">
                                            {/* Trạng thái */}
                                            <div className="flex justify-between items-center p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                                              <h3 className="text-lg font-semibold text-gray-800">
                                                Trạng thái đặt phòng
                                              </h3>
                                              <Badge
                                                className={`${statusInfo.color} shadow-md`}
                                              >
                                                {statusInfo.label}
                                              </Badge>
                                            </div>

                                            {/* Thông tin phòng */}
                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="p-4 rounded-lg bg-gray-50/50">
                                                <Label className="text-sm font-medium text-gray-600">
                                                  Loại phòng
                                                </Label>
                                                <p className="text-lg font-semibold text-gray-800">
                                                  {getRoomTypeLabel(
                                                    booking.room.type
                                                  )}
                                                </p>
                                              </div>
                                              <div className="p-4 rounded-lg bg-gray-50/50">
                                                <Label className="text-sm font-medium text-gray-600">
                                                  Số phòng
                                                </Label>
                                                <p className="text-lg font-semibold text-gray-800">
                                                  Phòng {booking.room.number}
                                                </p>
                                              </div>
                                            </div>

                                            {/* Thời gian */}
                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="p-4 rounded-lg bg-blue-50/50">
                                                <Label className="text-sm font-medium text-gray-600">
                                                  Ngày nhận phòng
                                                </Label>
                                                <p className="text-lg font-semibold text-gray-800">
                                                  {booking.checkIn ||
                                                  booking.check_in
                                                    ? formatDate(
                                                        booking.checkIn ||
                                                          booking.check_in
                                                      )
                                                    : "N/A"}
                                                </p>
                                              </div>
                                              <div className="p-4 rounded-lg bg-green-50/50">
                                                <Label className="text-sm font-medium text-gray-600">
                                                  Ngày trả phòng
                                                </Label>
                                                <p className="text-lg font-semibold text-gray-800">
                                                  {booking.checkOut ||
                                                  booking.check_out
                                                    ? formatDate(
                                                        (booking.checkOut ||
                                                          booking.check_out) as string
                                                      )
                                                    : "N/A"}
                                                </p>
                                              </div>
                                            </div>

                                            {/* Chi tiết booking */}
                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="p-4 rounded-lg bg-purple-50/50">
                                                <Label className="text-sm font-medium text-gray-600">
                                                  Số khách
                                                </Label>
                                                <p className="text-lg font-semibold text-gray-800 flex items-center">
                                                  <Users
                                                    size={16}
                                                    className="mr-2"
                                                  />
                                                  {booking.guests} người
                                                </p>
                                              </div>
                                              <div className="p-4 rounded-lg bg-amber-50/50">
                                                <Label className="text-sm font-medium text-gray-600">
                                                  Tổng tiền
                                                </Label>
                                                <p className="text-xl font-bold text-amber-700">
                                                  {formatPrice(
                                                    (booking.totalPrice ||
                                                      booking.total_price) as
                                                      | string
                                                      | number
                                                  )}
                                                </p>
                                              </div>
                                            </div>

                                            {/* Thông tin thanh toán */}
                                            <div className="grid grid-cols-2 gap-4">
                                              <div className="p-4 rounded-lg bg-green-50/50">
                                                <Label className="text-sm font-medium text-gray-600">
                                                  Tiền đặt cọc
                                                </Label>
                                                <p className="text-lg font-semibold text-green-700">
                                                  {booking.depositAmount ||
                                                  booking.deposit_amount
                                                    ? formatPrice(
                                                        (booking.depositAmount ||
                                                          booking.deposit_amount) as
                                                          | string
                                                          | number
                                                      )
                                                    : booking.status ===
                                                        "deposit_paid" ||
                                                      booking.status ===
                                                        "confirmed"
                                                    ? formatPrice(
                                                        parseFloat(
                                                          booking.totalPrice ||
                                                            booking.total_price ||
                                                            "0"
                                                        ) * 0.3
                                                      )
                                                    : "Chưa đặt cọc"}
                                                </p>
                                              </div>
                                              <div className="p-4 rounded-lg bg-blue-50/50">
                                                <Label className="text-sm font-medium text-gray-600">
                                                  Số tiền còn lại
                                                </Label>
                                                <p className="text-lg font-semibold text-blue-700">
                                                  {(() => {
                                                    const totalPrice =
                                                      parseFloat(
                                                        booking.totalPrice ||
                                                          booking.total_price ||
                                                          "0"
                                                      );
                                                    const depositAmount =
                                                      parseFloat(
                                                        booking.depositAmount ||
                                                          booking.deposit_amount ||
                                                          "0"
                                                      );
                                                    const remainingAmount =
                                                      parseFloat(
                                                        booking.remainingAmount ||
                                                          booking.remaining_amount ||
                                                          "0"
                                                      );

                                                    if (
                                                      remainingAmount > 0 &&
                                                      remainingAmount <
                                                        totalPrice
                                                    ) {
                                                      return formatPrice(
                                                        remainingAmount
                                                      );
                                                    } else if (
                                                      depositAmount > 0
                                                    ) {
                                                      return formatPrice(
                                                        totalPrice -
                                                          depositAmount
                                                      );
                                                    } else if (
                                                      booking.status ===
                                                        "deposit_paid" ||
                                                      booking.status ===
                                                        "confirmed"
                                                    ) {
                                                      return formatPrice(
                                                        totalPrice * 0.7
                                                      );
                                                    } else {
                                                      return formatPrice(
                                                        totalPrice
                                                      );
                                                    }
                                                  })()}
                                                </p>
                                              </div>
                                            </div>

                                            {/* Tiện nghi */}
                                            <div className="p-4 rounded-lg bg-gray-50/50">
                                              <Label className="text-sm font-medium text-gray-600">
                                                Tiện nghi phòng
                                              </Label>
                                              <div className="flex flex-wrap gap-2 mt-3">
                                                {(Array.isArray(
                                                  booking.room.amenities
                                                )
                                                  ? booking.room.amenities
                                                  : JSON.parse(
                                                      booking.room.amenities ||
                                                        "[]"
                                                    )
                                                ).map(
                                                  (
                                                    amenity: string,
                                                    idx: number
                                                  ) => (
                                                    <Badge
                                                      key={idx}
                                                      className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200"
                                                    >
                                                      {amenity}
                                                    </Badge>
                                                  )
                                                )}
                                              </div>
                                            </div>

                                            {/* Yêu cầu đặc biệt */}
                                            {booking.specialRequests && (
                                              <div className="p-4 rounded-lg bg-yellow-50/50">
                                                <Label className="text-sm font-medium text-gray-600">
                                                  Yêu cầu đặc biệt
                                                </Label>
                                                <p className="mt-2 text-sm bg-white p-3 rounded-md border border-yellow-200">
                                                  {booking.specialRequests}
                                                </p>
                                              </div>
                                            )}

                                            {/* Mô tả phòng */}
                                            {booking.room.description && (
                                              <div className="p-4 rounded-lg bg-gray-50/50">
                                                <Label className="text-sm font-medium text-gray-600">
                                                  Mô tả phòng
                                                </Label>
                                                <p className="mt-2 text-sm text-gray-600">
                                                  {booking.room.description}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </DialogContent>
                                      </Dialog>

                                      {/* Chỉ hiển thị nút Hủy cho booking pending, confirmed hoặc deposit_paid */}
                                      {(booking.status === "pending" ||
                                        booking.status === "confirmed" ||
                                        booking.status === "deposit_paid") && (
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() => {
                                            cancelBookingMutation.mutate(
                                              booking.id
                                            );
                                          }}
                                          disabled={
                                            cancelBookingMutation.isPending
                                          }
                                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-md"
                                        >
                                          <X size={14} className="mr-1" />
                                          Hủy
                                        </Button>
                                      )}

                                      {booking.status === "completed" && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            setLocation(`/review/${booking.id}`)
                                          }
                                          className="bg-gradient-to-r from-yellow-400/10 to-orange-400/10 hover:from-yellow-400/20 hover:to-orange-400/20 border-yellow-400/30 text-yellow-700"
                                        >
                                          <Star size={14} className="mr-1" />
                                          Đánh giá
                                        </Button>
                                      )}

                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleRebookRoom(booking.room)
                                        }
                                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                      >
                                        Đặt lại
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        }
                      )}
                    </div>
                  )}

                  {/* AI Recommendation */}
                  {recommendations.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-8"
                    >
                      <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-0 shadow-xl">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                <span className="text-2xl">🤖</span>
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                                Gợi ý đặt phòng từ AI
                              </h3>
                              <p className="text-gray-700 mb-4 leading-relaxed">
                                Dựa trên lịch sử và sở thích của bạn, chúng tôi
                                khuyến nghị{" "}
                                <strong className="text-indigo-600">
                                  {getRoomTypeLabel(recommendations[0]?.type)}
                                </strong>{" "}
                                với{" "}
                                {(Array.isArray(recommendations[0]?.amenities)
                                  ? recommendations[0]?.amenities
                                  : (() => {
                                      try {
                                        return JSON.parse(
                                          recommendations[0]?.amenities || "[]"
                                        );
                                      } catch (error) {
                                        return [];
                                      }
                                    })()
                                )
                                  .slice(0, 2)
                                  .join(", ")}{" "}
                                cho kỳ nghỉ sắp tới.
                              </p>
                              <Button
                                onClick={() => setLocation("/booking")}
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg"
                              >
                                <Plus size={16} className="mr-2" />
                                Đặt ngay
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
