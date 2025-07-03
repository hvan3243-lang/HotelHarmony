import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Search, 
  Calendar, 
  Users, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  User,
  Phone,
  Mail,
  Bed
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Booking, Room, User as UserType } from "@shared/schema";

export default function CheckIn() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<(Booking & { user: UserType; room: Room }) | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all bookings for search
  const { data: allBookings = [] } = useQuery({
    queryKey: ["/api/admin/bookings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/bookings");
      return await response.json();
    },
  });

  // Filter bookings based on search
  const filteredBookings = allBookings.filter((booking: Booking & { user: UserType; room: Room }) => {
    if (!searchQuery) return false;
    
    const searchLower = searchQuery.toLowerCase();
    const bookingId = `hlx${booking.id}`;
    const customerName = `${booking.user?.firstName} ${booking.user?.lastName}`.toLowerCase();
    const roomNumber = booking.room?.number?.toLowerCase();
    
    return (
      bookingId.includes(searchLower) ||
      customerName.includes(searchLower) ||
      roomNumber?.includes(searchLower)
    );
  });

  // Process check-in payment
  const checkInMutation = useMutation({
    mutationFn: async (data: { bookingId: number; paymentMethod: string }) => {
      const response = await apiRequest("POST", "/api/checkin-payment", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Check-in thành công!",
        description: "Khách hàng đã thanh toán đầy đủ và hoàn tất check-in.",
      });
      setShowPaymentDialog(false);
      setSelectedBooking(null);
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi check-in",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCompleteCheckIn = (paymentMethod: string) => {
    if (!selectedBooking) return;
    
    checkInMutation.mutate({
      bookingId: selectedBooking.id,
      paymentMethod
    });
  };

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('vi-VN').format(parseFloat(price.toString())) + "đ";
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getRemainingAmount = (totalPrice: string) => {
    return Math.round(parseFloat(totalPrice) * 0.7);
  };

  const getDepositAmount = (totalPrice: string) => {
    return Math.round(parseFloat(totalPrice) * 0.3);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; color: string }> = {
      pending: { variant: "outline", label: "Chờ xác nhận", color: "text-yellow-600" },
      deposit_paid: { variant: "secondary", label: "Đã đặt cọc", color: "text-blue-600" },
      confirmed: { variant: "default", label: "Đã xác nhận", color: "text-green-600" },
      completed: { variant: "default", label: "Đã hoàn thành", color: "text-green-600" },
      cancelled: { variant: "destructive", label: "Đã hủy", color: "text-red-600" },
    };
    return variants[status] || { variant: "secondary", label: status, color: "text-gray-600" };
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold mb-2">Check-in Khách Hàng</h1>
                <p className="text-muted-foreground">
                  Tìm kiếm và xử lý check-in cho khách hàng
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="mr-2" size={20} />
                Tìm kiếm đặt phòng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Mã đặt phòng, tên khách hàng hoặc số phòng</Label>
                  <Input
                    id="search"
                    placeholder="Nhập HLX123, Nguyễn Văn A, hoặc 101..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={() => setSearchQuery("")}
                    variant="outline"
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search Results */}
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Kết quả tìm kiếm ({filteredBookings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <p className="text-muted-foreground">Không tìm thấy đặt phòng nào</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBookings.map((booking: Booking & { user: UserType; room: Room }) => {
                      const statusInfo = getStatusBadge(booking.status);
                      const canCheckIn = booking.status === 'deposit_paid';
                      
                      return (
                        <Card key={booking.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                              <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-4">
                                  <h3 className="text-lg font-semibold">
                                    HLX{booking.id} - {booking.user?.firstName} {booking.user?.lastName}
                                  </h3>
                                  <Badge variant={statusInfo.variant}>
                                    {statusInfo.label}
                                  </Badge>
                                  {canCheckIn && (
                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                      Sẵn sàng check-in
                                    </Badge>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium text-muted-foreground">Phòng:</span>
                                    <p>{booking.room?.number} - {booking.room?.type}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-muted-foreground">Check-in:</span>
                                    <p>{formatDate(booking.checkIn)}</p>
                                    {booking.checkInTime && <p className="text-sm text-muted-foreground">Giờ: {booking.checkInTime}</p>}
                                  </div>
                                  <div>
                                    <span className="font-medium text-muted-foreground">Check-out:</span>
                                    <p>{formatDate(booking.checkOut)}</p>
                                    {booking.checkOutTime && <p className="text-sm text-muted-foreground">Giờ: {booking.checkOutTime}</p>}
                                  </div>
                                  <div>
                                    <span className="font-medium text-muted-foreground">Khách:</span>
                                    <p>{booking.guests} người</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-6 text-sm">
                                  <div>
                                    <span className="font-medium text-muted-foreground">Tổng tiền:</span>
                                    <span className="ml-2 font-semibold text-primary">
                                      {formatPrice(booking.totalPrice)}
                                    </span>
                                  </div>
                                  {booking.status === 'deposit_paid' && (
                                    <>
                                      <div>
                                        <span className="font-medium text-muted-foreground">Đã đặt cọc:</span>
                                        <span className="ml-2 text-green-600 font-semibold">
                                          {formatPrice(getDepositAmount(booking.totalPrice))}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="font-medium text-muted-foreground">Còn lại:</span>
                                        <span className="ml-2 text-orange-600 font-semibold">
                                          {formatPrice(getRemainingAmount(booking.totalPrice))}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-col gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedBooking(booking)}
                                >
                                  Xem chi tiết
                                </Button>
                                {canCheckIn && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                      setShowPaymentDialog(true);
                                    }}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle size={16} className="mr-2" />
                                    Check-in
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Booking Details Dialog */}
        <Dialog open={!!selectedBooking && !showPaymentDialog} onOpenChange={() => setSelectedBooking(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Chi tiết đặt phòng HLX{selectedBooking?.id}</DialogTitle>
            </DialogHeader>
            
            {selectedBooking && (
              <div className="space-y-6">
                {/* Customer Info */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <User className="mr-2" size={16} />
                    Thông tin khách hàng
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Họ tên:</span>
                      <p>{selectedBooking.user?.firstName} {selectedBooking.user?.lastName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Email:</span>
                      <p>{selectedBooking.user?.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Điện thoại:</span>
                      <p>{selectedBooking.user?.phone || "Chưa cập nhật"}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Trạng thái:</span>
                      <Badge variant={getStatusBadge(selectedBooking.status).variant}>
                        {getStatusBadge(selectedBooking.status).label}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Room Info */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Bed className="mr-2" size={16} />
                    Thông tin phòng
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Số phòng:</span>
                      <p>{selectedBooking.room?.number}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Loại phòng:</span>
                      <p className="capitalize">{selectedBooking.room?.type}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Check-in:</span>
                      <p>{formatDate(selectedBooking.checkIn)}</p>
                      {selectedBooking.checkInTime && <p className="text-sm text-muted-foreground">Giờ: {selectedBooking.checkInTime}</p>}
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Check-out:</span>
                      <p>{formatDate(selectedBooking.checkOut)}</p>
                      {selectedBooking.checkOutTime && <p className="text-sm text-muted-foreground">Giờ: {selectedBooking.checkOutTime}</p>}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Payment Info */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <CreditCard className="mr-2" size={16} />
                    Thông tin thanh toán
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Tổng tiền:</span>
                      <span className="font-semibold">{formatPrice(selectedBooking.totalPrice)}</span>
                    </div>
                    {selectedBooking.status === 'deposit_paid' && (
                      <>
                        <div className="flex justify-between text-green-600">
                          <span>Đã đặt cọc (30%):</span>
                          <span className="font-semibold">{formatPrice(getDepositAmount(selectedBooking.totalPrice))}</span>
                        </div>
                        <div className="flex justify-between text-orange-600">
                          <span>Còn phải thu (70%):</span>
                          <span className="font-semibold">{formatPrice(getRemainingAmount(selectedBooking.totalPrice))}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {selectedBooking.status === 'deposit_paid' && (
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setShowPaymentDialog(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Tiến hành check-in
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thu tiền check-in</DialogTitle>
            </DialogHeader>
            
            {selectedBooking && (
              <div className="space-y-6">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Số tiền cần thu:</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(getRemainingAmount(selectedBooking.totalPrice))}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (70% của tổng tiền {formatPrice(selectedBooking.totalPrice)})
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="font-medium">Chọn phương thức thanh toán:</p>
                  
                  <Button
                    onClick={() => handleCompleteCheckIn("cash")}
                    disabled={checkInMutation.isPending}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <CreditCard className="mr-2" size={16} />
                    Tiền mặt
                  </Button>
                  
                  <Button
                    onClick={() => handleCompleteCheckIn("card")}
                    disabled={checkInMutation.isPending}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <CreditCard className="mr-2" size={16} />
                    Thẻ tín dụng/ghi nợ
                  </Button>
                  
                  <Button
                    onClick={() => handleCompleteCheckIn("transfer")}
                    disabled={checkInMutation.isPending}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <CreditCard className="mr-2" size={16} />
                    Chuyển khoản
                  </Button>
                </div>

                {checkInMutation.isPending && (
                  <div className="text-center text-sm text-muted-foreground">
                    Đang xử lý thanh toán...
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}