import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import type { Room, User as UserType } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  CreditCard,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface CustomerForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  idNumber: string;
}

interface BookingForm {
  checkIn: string;
  checkOut: string;
  checkInTime: string;
  checkOutTime: string;
  guests: number;
  specialRequests: string;
}

export default function WalkInBooking() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1); // 1: Customer Info, 2: Room Selection, 3: Payment

  // Check authentication on component mount
  useEffect(() => {
    if (!authManager.isAuthenticated() || !authManager.isAdmin()) {
      setLocation("/auth");
      return;
    }
  }, [setLocation]);

  // Don't render if not authenticated
  if (!authManager.isAuthenticated() || !authManager.isAdmin()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }
  const [customerForm, setCustomerForm] = useState<CustomerForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    idNumber: "",
  });
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    checkIn: new Date().toISOString().split("T")[0],
    checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    checkInTime: "14:00",
    checkOutTime: "12:00",
    guests: 1,
    specialRequests: "",
  });
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [customerExists, setCustomerExists] = useState<UserType | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get available rooms based on dates
  const { data: roomData, isLoading: roomsLoading } = useQuery({
    queryKey: [
      "/api/rooms/available",
      bookingForm.checkIn,
      bookingForm.checkOut,
    ],
    queryFn: async () => {
      const response = await apiRequest(
        "POST",
        "/api/rooms/check-availability",
        {
          checkIn: bookingForm.checkIn,
          checkOut: bookingForm.checkOut,
        }
      );
      return await response.json();
    },
    enabled: !!bookingForm.checkIn && !!bookingForm.checkOut && step === 2,
  });

  const availableRooms = roomData?.availableRooms || [];

  // Check if customer exists
  const checkCustomerMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest(
        "GET",
        `/api/customers/check?email=${email}`
      );
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.exists) {
        setCustomerExists(data.customer);
        setCustomerForm({
          firstName: data.customer.firstName,
          lastName: data.customer.lastName,
          email: data.customer.email,
          phone: data.customer.phone || "",
          address: data.customer.address || "",
          idNumber: "",
        });
        toast({
          title: "Tìm thấy khách hàng",
          description: `${data.customer.firstName} ${data.customer.lastName} đã có trong hệ thống`,
        });
      } else {
        setCustomerExists(null);
        toast({
          title: "Khách hàng mới",
          description: "Vui lòng nhập đầy đủ thông tin khách hàng",
        });
      }
    },
  });

  // Create booking
  const createBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      // First create/get customer
      let customerId;
      if (customerExists) {
        customerId = customerExists.id;
      } else {
        // Check if customer exists first
        const checkResponse = await apiRequest(
          "GET",
          `/api/customers/check?email=${customerForm.email}`
        );
        const checkResult = await checkResponse.json();

        if (checkResult.exists) {
          customerId = checkResult.customer.id;
        } else {
          try {
            const customerResponse = await apiRequest(
              "POST",
              "/api/customers/walkin",
              {
                ...customerForm,
                role: "customer",
              }
            );
            const customer = await customerResponse.json();
            customerId = customer.id;
          } catch (createError: any) {
            // If creation fails due to duplicate, try to get existing customer
            const fallbackResponse = await apiRequest(
              "GET",
              `/api/customers/check?email=${customerForm.email}`
            );
            const fallbackResult = await fallbackResponse.json();
            if (fallbackResult.exists) {
              customerId = fallbackResult.customer.id;
            } else {
              throw createError;
            }
          }
        }
      }

      // Then create booking
      const bookingResponse = await apiRequest("POST", "/api/bookings/walkin", {
        customerId,
        roomId: selectedRoom!.id,
        checkIn: bookingForm.checkIn,
        checkOut: bookingForm.checkOut,
        checkInTime: bookingForm.checkInTime,
        checkOutTime: bookingForm.checkOutTime,
        guests: bookingForm.guests,
        specialRequests: bookingForm.specialRequests,
        totalPrice: calculateTotalPrice().toString(),
      });
      return await bookingResponse.json();
    },
    onSuccess: (data) => {
      setCreatedBooking(data);
      setShowPaymentDialog(true);
      toast({
        title: "Tạo đặt phòng thành công",
        description: `Mã đặt phòng: HLX${data.id}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi tạo đặt phòng",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Complete payment
  const completePaymentMutation = useMutation({
    mutationFn: async (data: {
      paymentMethod: string;
      paymentType: "full" | "deposit";
    }) => {
      const response = await apiRequest("POST", "/api/walkin-payment", {
        bookingId: createdBooking.id,
        paymentMethod: data.paymentMethod,
        paymentType: data.paymentType,
        amount:
          data.paymentType === "full"
            ? calculateTotalPrice()
            : Math.round(calculateTotalPrice() * 0.3),
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thanh toán đầy đủ thành công",
        description:
          "Đặt phòng walk-in đã được xác nhận và khách có thể nhận phòng ngay!",
      });
      // Reset form
      setStep(1);
      setCustomerForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        idNumber: "",
      });
      setBookingForm({
        checkIn: new Date().toISOString().split("T")[0],
        checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        checkInTime: "14:00",
        checkOutTime: "12:00",
        guests: 1,
        specialRequests: "",
      });
      setSelectedRoom(null);
      setCustomerExists(null);
      setCreatedBooking(null);
      setShowPaymentDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi thanh toán",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculateTotalPrice = () => {
    if (!selectedRoom || !bookingForm.checkIn || !bookingForm.checkOut)
      return 0;
    const checkIn = new Date(bookingForm.checkIn);
    const checkOut = new Date(bookingForm.checkOut);
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
    return nights * parseFloat(selectedRoom.price.replace(/[.,]/g, ""));
  };

  const calculateStayInfo = () => {
    if (!bookingForm.checkIn || !bookingForm.checkOut) return null;
    const checkInDate = new Date(bookingForm.checkIn);
    const checkOutDate = new Date(bookingForm.checkOut);
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      nights,
      checkInTime: bookingForm.checkInTime,
      checkOutTime: bookingForm.checkOutTime,
      isOvernightStay: nights >= 1,
    };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("vi-VN");
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

  const handleNextStep = () => {
    if (step === 1) {
      if (
        !customerForm.firstName ||
        !customerForm.lastName ||
        !customerForm.email ||
        !customerForm.phone
      ) {
        toast({
          title: "Thiếu thông tin",
          description: "Vui lòng nhập đầy đủ thông tin bắt buộc",
          variant: "destructive",
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedRoom) {
        toast({
          title: "Chưa chọn phòng",
          description: "Vui lòng chọn phòng cho khách hàng",
          variant: "destructive",
        });
        return;
      }
      setStep(3);
    }
  };

  const handleCompleteBooking = () => {
    createBookingMutation.mutate({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 shadow-2xl border-0">
            <CardContent className="p-8">
              <div className="text-center text-white">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm"
                >
                  <UserPlus className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="text-4xl font-bold mb-3">Đặt Phòng Walk-in</h1>
                <p className="text-emerald-100 text-lg">
                  👨‍💼 Nhân viên lễ tân đặt phòng cho khách hàng đến trực tiếp
                </p>
                <div className="mt-4 flex justify-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span>Thông tin khách hàng</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                    <span>Chọn phòng</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white/50 rounded-full"></div>
                    <span>Thanh toán</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-white/80 backdrop-blur-sm border-emerald-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-8">
                <div
                  className={`flex items-center transition-all duration-300 ${
                    step >= 1 ? "text-emerald-600" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      step >= 1
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step > 1 ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="font-semibold">1</span>
                    )}
                  </div>
                  <span className="ml-3 font-medium">Thông tin khách hàng</span>
                </div>

                <div
                  className={`w-20 h-1 rounded-full transition-all duration-300 ${
                    step >= 2
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                      : "bg-gray-200"
                  }`}
                ></div>

                <div
                  className={`flex items-center transition-all duration-300 ${
                    step >= 2 ? "text-emerald-600" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      step >= 2
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {step > 2 ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="font-semibold">2</span>
                    )}
                  </div>
                  <span className="ml-3 font-medium">Chọn phòng</span>
                </div>

                <div
                  className={`w-20 h-1 rounded-full transition-all duration-300 ${
                    step >= 3
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                      : "bg-gray-200"
                  }`}
                ></div>

                <div
                  className={`flex items-center transition-all duration-300 ${
                    step >= 3 ? "text-emerald-600" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      step >= 3
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <span className="font-semibold">3</span>
                  </div>
                  <span className="ml-3 font-medium">
                    Xác nhận & Thanh toán
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Step 1: Customer Information */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-white to-emerald-50 border-emerald-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center">
                  <UserPlus className="mr-3" size={24} />
                  Thông tin khách hàng
                </CardTitle>
                <div className="bg-white/20 p-4 rounded-lg border border-white/30 backdrop-blur-sm">
                  <p className="text-emerald-50">
                    📋 <strong>Hướng dẫn:</strong> Nhân viên lễ tân nhập thông
                    tin khách hàng đến trực tiếp
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email check */}
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      value={customerForm.email}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="email@example.com"
                      className="flex-1"
                    />
                    <Button
                      onClick={() =>
                        checkCustomerMutation.mutate(customerForm.email)
                      }
                      disabled={
                        !customerForm.email || checkCustomerMutation.isPending
                      }
                      variant="outline"
                    >
                      Kiểm tra
                    </Button>
                  </div>
                  {customerExists && (
                    <p className="text-sm text-green-600 mt-1">
                      ✓ Khách hàng đã tồn tại trong hệ thống
                    </p>
                  )}
                </div>

                {/* Customer details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Họ *</Label>
                    <Input
                      id="firstName"
                      value={customerForm.firstName}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                      placeholder="Nguyễn"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Tên *</Label>
                    <Input
                      id="lastName"
                      value={customerForm.lastName}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                      placeholder="Văn A"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Số điện thoại *</Label>
                    <Input
                      id="phone"
                      value={customerForm.phone}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="0123456789"
                    />
                  </div>
                  <div>
                    <Label htmlFor="idNumber">CCCD/CMND *</Label>
                    <Input
                      id="idNumber"
                      value={customerForm.idNumber}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          idNumber: e.target.value,
                        }))
                      }
                      placeholder="123456789012"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input
                    id="address"
                    value={customerForm.address}
                    onChange={(e) =>
                      setCustomerForm((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    placeholder="Địa chỉ đầy đủ"
                  />
                </div>

                <div className="flex justify-end">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleNextStep}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Tiếp theo: Chọn phòng
                      <Calendar className="ml-2" size={20} />
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Room Selection */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Booking Details */}
            <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center">
                  <Calendar className="mr-3" size={24} />
                  Chi tiết đặt phòng
                </CardTitle>
                <div className="bg-white/20 p-4 rounded-lg border border-white/30 backdrop-blur-sm">
                  <p className="text-blue-50">
                    🏨 <strong>Quy trình:</strong> Nhân viên chọn phòng trống
                    phù hợp với yêu cầu của khách
                  </p>
                  <p className="text-blue-100 text-sm mt-2">
                    💡 <strong>Ví dụ:</strong> Khách đặt 4:00 PM hôm nay đến
                    2:00 PM ngày mai = 1 đêm
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="checkIn">Ngày nhận phòng</Label>
                    <Input
                      id="checkIn"
                      type="date"
                      value={bookingForm.checkIn}
                      onChange={(e) =>
                        setBookingForm((prev) => ({
                          ...prev,
                          checkIn: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkInTime">Giờ nhận phòng</Label>
                    <Input
                      id="checkInTime"
                      type="time"
                      value={bookingForm.checkInTime}
                      onChange={(e) =>
                        setBookingForm((prev) => ({
                          ...prev,
                          checkInTime: e.target.value,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Mặc định: 14:00 (2:00 PM)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="checkOut">Ngày trả phòng</Label>
                    <Input
                      id="checkOut"
                      type="date"
                      value={bookingForm.checkOut}
                      onChange={(e) =>
                        setBookingForm((prev) => ({
                          ...prev,
                          checkOut: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkOutTime">Giờ trả phòng</Label>
                    <Input
                      id="checkOutTime"
                      type="time"
                      value={bookingForm.checkOutTime}
                      onChange={(e) =>
                        setBookingForm((prev) => ({
                          ...prev,
                          checkOutTime: e.target.value,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Mặc định: 12:00 (12:00 PM)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="guests">Số khách</Label>
                    <Select
                      value={bookingForm.guests.toString()}
                      onValueChange={(value) =>
                        setBookingForm((prev) => ({
                          ...prev,
                          guests: parseInt(value),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} khách
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="specialRequests">Yêu cầu đặc biệt</Label>
                  <Textarea
                    id="specialRequests"
                    value={bookingForm.specialRequests}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        specialRequests: e.target.value,
                      }))
                    }
                    placeholder="Giường đôi, tầng cao, view biển..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Available Rooms */}
            <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center">
                  <Users className="mr-3" size={24} />
                  Phòng trống ({availableRooms.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {roomsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p>Đang tìm phòng trống...</p>
                  </div>
                ) : availableRooms.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle
                      className="mx-auto mb-4 text-orange-500"
                      size={48}
                    />
                    <h3 className="font-semibold text-lg mb-2">
                      Không có phòng trống
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Không có phòng nào trống trong thời gian từ{" "}
                      {formatDate(bookingForm.checkIn)} đến{" "}
                      {formatDate(bookingForm.checkOut)}
                    </p>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-800">
                        💡 <strong>Gợi ý:</strong> Thử chọn ngày khác hoặc kiểm
                        tra lại ngày đã đặt
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {availableRooms.map((room: Room) => (
                      <Card
                        key={room.id}
                        className={`cursor-pointer transition-all ${
                          selectedRoom?.id === room.id
                            ? "ring-2 ring-primary"
                            : "hover:shadow-md"
                        }`}
                        onClick={() => setSelectedRoom(room)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold">
                                  Phòng {room.number}
                                </h3>
                                <Badge variant="outline">
                                  {getRoomTypeLabel(room.type)}
                                </Badge>
                                {selectedRoom?.id === room.id && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    ✓ Đã chọn
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Sức chứa: {room.capacity} khách
                              </p>
                              {room.description && (
                                <p className="text-sm text-muted-foreground">
                                  {room.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-primary">
                                {formatPrice(
                                  parseFloat(room.price.replace(/[.,]/g, ""))
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                / đêm
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-lg font-medium border-2 hover:bg-gray-50 transition-all duration-300"
                >
                  Quay lại
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleNextStep}
                  disabled={!selectedRoom}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                >
                  Tiếp theo: Xác nhận
                  <CheckCircle className="ml-2" size={20} />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && selectedRoom && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-white to-green-50 border-green-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-3" size={24} />
                  Xác nhận đặt phòng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Customer Summary */}
                <div>
                  <h4 className="font-semibold mb-3">Thông tin khách hàng</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Họ tên:</span>
                      <p>
                        {customerForm.firstName} {customerForm.lastName}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>
                      <p>{customerForm.email}</p>
                    </div>
                    <div>
                      <span className="font-medium">Điện thoại:</span>
                      <p>{customerForm.phone}</p>
                    </div>
                    <div>
                      <span className="font-medium">CCCD/CMND:</span>
                      <p>{customerForm.idNumber}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Booking Summary */}
                <div>
                  <h4 className="font-semibold mb-3">Thông tin đặt phòng</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Phòng:</span>
                      <p>
                        {selectedRoom.number} -{" "}
                        {getRoomTypeLabel(selectedRoom.type)}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Số khách:</span>
                      <p>{bookingForm.guests} người</p>
                    </div>
                    <div>
                      <span className="font-medium">Check-in:</span>
                      <p>{formatDate(bookingForm.checkIn)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Check-out:</span>
                      <p>{formatDate(bookingForm.checkOut)}</p>
                    </div>
                  </div>
                  {bookingForm.specialRequests && (
                    <div className="mt-3">
                      <span className="font-medium text-sm">
                        Yêu cầu đặc biệt:
                      </span>
                      <p className="text-sm">{bookingForm.specialRequests}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Price Summary */}
                <div>
                  <h4 className="font-semibold mb-3">Chi tiết giá</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Giá phòng/đêm:</span>
                      <span>
                        {formatPrice(
                          parseFloat(selectedRoom.price.replace(/[.,]/g, ""))
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số đêm:</span>
                      <span>
                        {Math.ceil(
                          (new Date(bookingForm.checkOut).getTime() -
                            new Date(bookingForm.checkIn).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        đêm
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Thanh toán đầy đủ:</span>
                      <div className="text-right">
                        <span className="text-primary">
                          {formatPrice(calculateTotalPrice())}
                        </span>
                        {(() => {
                          const stayInfo = calculateStayInfo();
                          return stayInfo ? (
                            <div className="text-xs text-muted-foreground mt-1">
                              {stayInfo.nights} đêm • {stayInfo.checkInTime} -{" "}
                              {stayInfo.checkOutTime}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                      💡 Khách đến trực tiếp cần thanh toán 100% ngay
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="px-6 py-3 text-lg font-medium border-2 hover:bg-gray-50 transition-all duration-300"
                    >
                      Quay lại
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleCompleteBooking}
                      disabled={createBookingMutation.isPending}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                    >
                      {createBookingMutation.isPending
                        ? "Đang tạo..."
                        : "Tạo đặt phòng"}
                      <CreditCard className="ml-2" size={20} />
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-lg bg-gradient-to-br from-white to-green-50 border-green-200 shadow-2xl">
            <DialogHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg -m-6 mb-6 p-6">
              <DialogTitle className="flex items-center text-xl">
                <CreditCard className="mr-3" size={24} />
                Chọn phương thức thanh toán
              </DialogTitle>
              <div className="bg-white/20 p-4 rounded-lg border border-white/30 backdrop-blur-sm mt-4">
                <p className="text-green-50">
                  💳 <strong>Bước cuối:</strong> Nhân viên thu tiền từ khách và
                  xác nhận thanh toán
                </p>
              </div>
            </DialogHeader>

            {createdBooking && (
              <div className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 shadow-lg">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm text-emerald-600 font-medium mb-2">
                    Mã đặt phòng:
                  </p>
                  <p className="text-2xl font-bold text-emerald-800 mb-2">
                    HLX{createdBooking.id}
                  </p>
                  <p className="text-lg font-semibold text-emerald-700">
                    Tổng tiền: {formatPrice(calculateTotalPrice())}
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="font-medium">Chọn phương thức thanh toán:</p>
                  <p className="text-sm text-muted-foreground bg-amber-50 p-3 rounded-lg border border-amber-200">
                    💡 Khách đến trực tiếp cần thanh toán đầy đủ ngay
                  </p>

                  <div className="space-y-3">
                    <Button
                      onClick={() =>
                        completePaymentMutation.mutate({
                          paymentMethod: "cash",
                          paymentType: "full",
                        })
                      }
                      disabled={completePaymentMutation.isPending}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <CreditCard className="mr-2" size={16} />
                      Tiền mặt ({formatPrice(calculateTotalPrice())})
                    </Button>

                    <Button
                      onClick={() =>
                        completePaymentMutation.mutate({
                          paymentMethod: "card",
                          paymentType: "full",
                        })
                      }
                      disabled={completePaymentMutation.isPending}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <CreditCard className="mr-2" size={16} />
                      Thẻ tín dụng/ghi nợ ({formatPrice(calculateTotalPrice())})
                    </Button>

                    <Button
                      onClick={() =>
                        completePaymentMutation.mutate({
                          paymentMethod: "transfer",
                          paymentType: "full",
                        })
                      }
                      disabled={completePaymentMutation.isPending}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <CreditCard className="mr-2" size={16} />
                      Chuyển khoản ({formatPrice(calculateTotalPrice())})
                    </Button>
                  </div>
                </div>

                {completePaymentMutation.isPending && (
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
