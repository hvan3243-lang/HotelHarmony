import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Crown, Calendar, Bed, Users, Eye, X, Edit, Plus, Heart, Phone, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { User as UserType, Booking, Room } from "@shared/schema";

export default function Customer() {
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
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      phone: currentUser.phone || "",
      preferences: currentUser.preferences || [],
    });
  }, [setLocation]);

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings"],
    enabled: !!user,
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ["/api/recommendations"],
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", "/api/users/profile", data),
    onSuccess: (updatedUser) => {
      authManager.login(updatedUser, authManager.getToken()!);
      setUser(updatedUser);
      setEditingProfile(false);
      toast({
        title: "Cập nhật thành công",
        description: "Thông tin cá nhân đã được cập nhật",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi cập nhật",
        description: error.message || "Có lỗi xảy ra khi cập nhật thông tin",
        variant: "destructive",
      });
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: (bookingId: number) => apiRequest("PUT", `/api/bookings/${bookingId}/cancel`, {}),
    onSuccess: () => {
      toast({
        title: "Hủy đặt phòng thành công",
        description: "Đặt phòng đã được hủy",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi hủy đặt phòng",
        description: error.message || "Có lỗi xảy ra khi hủy đặt phòng",
        variant: "destructive",
      });
    },
  });

  const preferences = [
    "view biển",
    "view núi",
    "spa & wellness", 
    "sang trọng",
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: "default", label: "Đang chờ" },
      confirmed: { variant: "default", label: "Đã xác nhận" },
      completed: { variant: "default", label: "Đã hoàn thành" },
      cancelled: { variant: "destructive", label: "Đã hủy" },
    };
    return variants[status] || { variant: "secondary", label: status };
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

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('vi-VN').format(parseFloat(price)) + "đ";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const filteredBookings = bookings.filter((booking: Booking & { room: Room }) => {
    if (!statusFilter || statusFilter === "all") return true;
    return booking.status === statusFilter;
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handlePreferenceChange = (preference: string, checked: boolean) => {
    setProfileForm(prev => ({
      ...prev,
      preferences: checked 
        ? [...prev.preferences, preference]
        : prev.preferences.filter(p => p !== preference)
    }));
  };

  if (!user) {
    return null;
  }

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter((b: Booking) => b.status === 'completed').length;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Customer Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-1">
                      {user.firstName} {user.lastName}
                    </h1>
                    <p className="text-muted-foreground mb-2">{user.email}</p>
                    <div className="flex items-center space-x-2">
                      {user.isVip && (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                          <Crown size={14} className="mr-1" />
                          Khách hàng VIP
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {totalBookings} đặt phòng
                      </Badge>
                    </div>
                  </div>
                </div>
                <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
                  <DialogTrigger asChild>
                    <Button>
                      <Edit size={16} className="mr-2" />
                      Chỉnh sửa thông tin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cập nhật thông tin cá nhân</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">Họ</Label>
                          <Input
                            id="firstName"
                            value={profileForm.firstName}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Tên</Label>
                          <Input
                            id="lastName"
                            value={profileForm.lastName}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input
                          id="phone"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-base font-medium">Sở thích</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {preferences.map((preference) => (
                            <div key={preference} className="flex items-center space-x-2">
                              <Checkbox
                                id={preference}
                                checked={profileForm.preferences.includes(preference)}
                                onCheckedChange={(checked) => handlePreferenceChange(preference, !!checked)}
                              />
                              <Label htmlFor={preference} className="text-sm capitalize">
                                {preference}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setEditingProfile(false)}>
                          Hủy
                        </Button>
                        <Button type="submit" disabled={updateProfileMutation.isPending}>
                          {updateProfileMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2" size={20} />
                    Thông tin cá nhân
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Phone size={16} className="text-muted-foreground" />
                    <span>{user.phone || "Chưa cập nhật"}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail size={16} className="text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar size={16} className="text-muted-foreground" />
                    <span>Tham gia {formatDate(user.createdAt!)}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Bed size={16} className="text-muted-foreground" />
                    <span>{completedBookings} lần nghỉ dưỡng</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Preferences */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="mr-2" size={20} />
                    Sở thích
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user.preferences && user.preferences.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.preferences.map((pref, index) => (
                        <Badge key={index} variant="secondary" className="capitalize">
                          {pref}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Chưa thiết lập sở thích
                    </p>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
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
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center">
                      <Calendar className="mr-2" size={20} />
                      Lịch sử đặt phòng
                    </CardTitle>
                    <div className="flex space-x-2">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Tất cả" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          <SelectItem value="pending">Đang chờ</SelectItem>
                          <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                          <SelectItem value="completed">Đã hoàn thành</SelectItem>
                          <SelectItem value="cancelled">Đã hủy</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={() => setLocation("/booking")}>
                        <Plus size={16} className="mr-2" />
                        Đặt phòng mới
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {bookingsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-32 bg-muted rounded-lg"></div>
                        </div>
                      ))}
                    </div>
                  ) : filteredBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="mx-auto mb-4 text-muted-foreground" size={48} />
                      <h3 className="text-lg font-semibold mb-2">
                        {statusFilter ? "Không có đặt phòng nào" : "Chưa có đặt phòng"}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {statusFilter 
                          ? "Không tìm thấy đặt phòng với trạng thái này"
                          : "Hãy bắt đầu đặt phòng đầu tiên của bạn"
                        }
                      </p>
                      <Button onClick={() => setLocation("/booking")}>
                        Đặt phòng ngay
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredBookings.map((booking: Booking & { room: Room }, index) => {
                        const statusInfo = getStatusBadge(booking.status);
                        return (
                          <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h3 className="text-lg font-semibold">
                                      {getRoomTypeLabel(booking.room.type)}
                                    </h3>
                                    <p className="text-muted-foreground">
                                      Mã đặt phòng: #HLX{booking.id}
                                    </p>
                                  </div>
                                  <Badge variant={statusInfo.variant as any}>
                                    {statusInfo.label}
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                  <div>
                                    <Label className="text-sm text-muted-foreground">Check-in</Label>
                                    <p className="font-medium">{formatDate(booking.checkIn)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm text-muted-foreground">Check-out</Label>
                                    <p className="font-medium">{formatDate(booking.checkOut)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm text-muted-foreground">Khách</Label>
                                    <p className="font-medium flex items-center">
                                      <Users size={14} className="mr-1" />
                                      {booking.guests}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-sm text-muted-foreground">Tổng tiền</Label>
                                    <p className="font-bold text-primary">
                                      {formatPrice(booking.totalPrice)}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center">
                                  <div className="text-sm text-muted-foreground">
                                    Phòng {booking.room.number} • {booking.room.amenities.slice(0, 2).join(", ")}
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button variant="outline" size="sm">
                                      <Eye size={14} className="mr-1" />
                                      Chi tiết
                                    </Button>
                                    {booking.status === 'pending' && (
                                      <Button 
                                        variant="destructive" 
                                        size="sm"
                                        onClick={() => cancelBookingMutation.mutate(booking.id)}
                                        disabled={cancelBookingMutation.isPending}
                                      >
                                        <X size={14} className="mr-1" />
                                        Hủy
                                      </Button>
                                    )}
                                    <Button variant="ghost" size="sm">
                                      Đặt lại
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* AI Recommendation */}
                  {recommendations.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-6"
                    >
                      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                                🤖
                              </div>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-primary mb-2">
                                Gợi ý đặt phòng từ AI
                              </h3>
                              <p className="text-primary/80 mb-4">
                                Dựa trên lịch sử và sở thích của bạn, chúng tôi khuyến nghị{" "}
                                <strong>{getRoomTypeLabel(recommendations[0]?.type)}</strong>{" "}
                                với {recommendations[0]?.amenities?.slice(0, 2).join(", ")} cho kỳ nghỉ sắp tới.
                              </p>
                              <Button onClick={() => setLocation("/booking")}>
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
