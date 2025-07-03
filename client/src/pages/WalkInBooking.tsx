import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  UserPlus, 
  Calendar, 
  Users, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Bed,
  Eye,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { authManager } from "@/lib/auth";
import type { Room, User as UserType } from "@shared/schema";

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
    idNumber: ""
  });
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    checkInTime: "14:00",
    checkOutTime: "12:00",
    guests: 1,
    specialRequests: ""
  });
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [customerExists, setCustomerExists] = useState<UserType | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get available rooms based on dates
  const { data: roomData, isLoading: roomsLoading } = useQuery({
    queryKey: ["/api/rooms/available", bookingForm.checkIn, bookingForm.checkOut],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/rooms/check-availability", {
        checkIn: bookingForm.checkIn,
        checkOut: bookingForm.checkOut
      });
      return await response.json();
    },
    enabled: !!bookingForm.checkIn && !!bookingForm.checkOut && step === 2,
  });

  const availableRooms = roomData?.availableRooms || [];

  // Check if customer exists
  const checkCustomerMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("GET", `/api/customers/check?email=${email}`);
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
          idNumber: ""
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
        const checkResponse = await apiRequest("GET", `/api/customers/check?email=${customerForm.email}`);
        const checkResult = await checkResponse.json();
        
        if (checkResult.exists) {
          customerId = checkResult.customer.id;
        } else {
          try {
            const customerResponse = await apiRequest("POST", "/api/customers/walkin", {
              ...customerForm,
              role: "customer"
            });
            const customer = await customerResponse.json();
            customerId = customer.id;
          } catch (createError: any) {
            // If creation fails due to duplicate, try to get existing customer
            const fallbackResponse = await apiRequest("GET", `/api/customers/check?email=${customerForm.email}`);
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
        totalPrice: calculateTotalPrice().toString()
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
    mutationFn: async (data: { paymentMethod: string; paymentType: 'full' | 'deposit' }) => {
      const response = await apiRequest("POST", "/api/walkin-payment", {
        bookingId: createdBooking.id,
        paymentMethod: data.paymentMethod,
        paymentType: data.paymentType,
        amount: data.paymentType === 'full' ? calculateTotalPrice() : Math.round(calculateTotalPrice() * 0.3)
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thanh toán đầy đủ thành công",
        description: "Đặt phòng walk-in đã được xác nhận và khách có thể nhận phòng ngay!",
      });
      // Reset form
      setStep(1);
      setCustomerForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        idNumber: ""
      });
      setBookingForm({
        checkIn: new Date().toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        checkInTime: "14:00",
        checkOutTime: "12:00",
        guests: 1,
        specialRequests: ""
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
    if (!selectedRoom || !bookingForm.checkIn || !bookingForm.checkOut) return 0;
    const checkIn = new Date(bookingForm.checkIn);
    const checkOut = new Date(bookingForm.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return nights * parseFloat(selectedRoom.price.replace(/[.,]/g, ''));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + "đ";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN');
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
      if (!customerForm.firstName || !customerForm.lastName || !customerForm.email || !customerForm.phone) {
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
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold mb-2">Đặt Phòng Walk-in</h1>
                <p className="text-muted-foreground">
                  👨‍💼 Nhân viên lễ tân đặt phòng cho khách hàng đến trực tiếp
                </p>
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
          <div className="flex items-center justify-center space-x-8">
            <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-muted'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Thông tin khách hàng</span>
            </div>
            
            <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
            
            <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-muted'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Chọn phòng</span>
            </div>
            
            <div className={`w-16 h-0.5 ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}></div>
            
            <div className={`flex items-center ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-white' : 'bg-muted'}`}>
                3
              </div>
              <span className="ml-2 font-medium">Xác nhận & Thanh toán</span>
            </div>
          </div>
        </motion.div>

        {/* Step 1: Customer Information */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="mr-2" size={20} />
                  Thông tin khách hàng
                </CardTitle>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    📋 <strong>Hướng dẫn:</strong> Nhân viên lễ tân nhập thông tin khách hàng đến trực tiếp
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
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@example.com"
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => checkCustomerMutation.mutate(customerForm.email)}
                      disabled={!customerForm.email || checkCustomerMutation.isPending}
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
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Nguyễn"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Tên *</Label>
                    <Input
                      id="lastName"
                      value={customerForm.lastName}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, lastName: e.target.value }))}
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
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="0123456789"
                    />
                  </div>
                  <div>
                    <Label htmlFor="idNumber">CCCD/CMND *</Label>
                    <Input
                      id="idNumber"
                      value={customerForm.idNumber}
                      onChange={(e) => setCustomerForm(prev => ({ ...prev, idNumber: e.target.value }))}
                      placeholder="123456789012"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input
                    id="address"
                    value={customerForm.address}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Địa chỉ đầy đủ"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleNextStep}>
                    Tiếp theo: Chọn phòng
                  </Button>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2" size={20} />
                  Chi tiết đặt phòng
                </CardTitle>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    🏨 <strong>Quy trình:</strong> Nhân viên chọn phòng trống phù hợp với yêu cầu của khách
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
                      onChange={(e) => setBookingForm(prev => ({ ...prev, checkIn: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkInTime">Giờ nhận phòng</Label>
                    <Input
                      id="checkInTime"
                      type="time"
                      value={bookingForm.checkInTime}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, checkInTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkOut">Ngày trả phòng</Label>
                    <Input
                      id="checkOut"
                      type="date"
                      value={bookingForm.checkOut}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, checkOut: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkOutTime">Giờ trả phòng</Label>
                    <Input
                      id="checkOutTime"
                      type="time"
                      value={bookingForm.checkOutTime}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, checkOutTime: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="guests">Số khách</Label>
                    <Select value={bookingForm.guests.toString()} onValueChange={(value) => setBookingForm(prev => ({ ...prev, guests: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map(num => (
                          <SelectItem key={num} value={num.toString()}>{num} khách</SelectItem>
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
                    onChange={(e) => setBookingForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                    placeholder="Giường đôi, tầng cao, view biển..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Available Rooms */}
            <Card>
              <CardHeader>
                <CardTitle>Phòng trống ({availableRooms.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {roomsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p>Đang tìm phòng trống...</p>
                  </div>
                ) : availableRooms.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="mx-auto mb-4 text-orange-500" size={48} />
                    <h3 className="font-semibold text-lg mb-2">Không có phòng trống</h3>
                    <p className="text-muted-foreground mb-4">
                      Không có phòng nào trống trong thời gian từ {formatDate(bookingForm.checkIn)} đến {formatDate(bookingForm.checkOut)}
                    </p>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-800">
                        💡 <strong>Gợi ý:</strong> Thử chọn ngày khác hoặc kiểm tra lại ngày đã đặt
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {availableRooms.map((room: Room) => (
                      <Card 
                        key={room.id} 
                        className={`cursor-pointer transition-all ${selectedRoom?.id === room.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                        onClick={() => setSelectedRoom(room)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="font-semibold">Phòng {room.number}</h3>
                                <Badge variant="outline">{getRoomTypeLabel(room.type)}</Badge>
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
                                <p className="text-sm text-muted-foreground">{room.description}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-primary">
                                {formatPrice(parseFloat(room.price.replace(/[.,]/g, '')))}
                              </p>
                              <p className="text-sm text-muted-foreground">/ đêm</p>
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
              <Button variant="outline" onClick={() => setStep(1)}>
                Quay lại
              </Button>
              <Button onClick={handleNextStep} disabled={!selectedRoom}>
                Tiếp theo: Xác nhận
              </Button>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2" size={20} />
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
                      <p>{customerForm.firstName} {customerForm.lastName}</p>
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
                      <p>{selectedRoom.number} - {getRoomTypeLabel(selectedRoom.type)}</p>
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
                      <span className="font-medium text-sm">Yêu cầu đặc biệt:</span>
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
                      <span>{formatPrice(parseFloat(selectedRoom.price.replace(/[.,]/g, '')))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Số đêm:</span>
                      <span>{Math.ceil((new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) / (1000 * 60 * 60 * 24))} đêm</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Thanh toán đầy đủ:</span>
                      <span className="text-primary">{formatPrice(calculateTotalPrice())}</span>
                    </div>
                    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                      💡 Khách đến trực tiếp cần thanh toán 100% ngay
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Quay lại
                  </Button>
                  <Button 
                    onClick={handleCompleteBooking}
                    disabled={createBookingMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {createBookingMutation.isPending ? "Đang tạo..." : "Tạo đặt phòng"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Chọn phương thức thanh toán</DialogTitle>
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  💳 <strong>Bước cuối:</strong> Nhân viên thu tiền từ khách và xác nhận thanh toán
                </p>
              </div>
            </DialogHeader>
            
            {createdBooking && (
              <div className="space-y-6">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Mã đặt phòng:</p>
                  <p className="text-lg font-bold">HLX{createdBooking.id}</p>
                  <p className="text-sm text-muted-foreground mt-1">Tổng tiền: {formatPrice(calculateTotalPrice())}</p>
                </div>

                <div className="space-y-4">
                  <p className="font-medium">Chọn phương thức thanh toán:</p>
                  <p className="text-sm text-muted-foreground bg-amber-50 p-3 rounded-lg border border-amber-200">
                    💡 Khách đến trực tiếp cần thanh toán đầy đủ ngay
                  </p>
                  
                  <div className="space-y-3">
                    <Button
                      onClick={() => completePaymentMutation.mutate({ paymentMethod: "cash", paymentType: "full" })}
                      disabled={completePaymentMutation.isPending}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <CreditCard className="mr-2" size={16} />
                      Tiền mặt ({formatPrice(calculateTotalPrice())})
                    </Button>
                    
                    <Button
                      onClick={() => completePaymentMutation.mutate({ paymentMethod: "card", paymentType: "full" })}
                      disabled={completePaymentMutation.isPending}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      <CreditCard className="mr-2" size={16} />
                      Thẻ tín dụng/ghi nợ ({formatPrice(calculateTotalPrice())})
                    </Button>

                    <Button
                      onClick={() => completePaymentMutation.mutate({ paymentMethod: "transfer", paymentType: "full" })}
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