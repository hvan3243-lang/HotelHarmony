import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, MapPin, Shield, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
// Import Stripe với cấu hình an toàn
import { apiRequest } from "@/lib/queryClient";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// Kiểm tra public key có tồn tại không
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!stripePublicKey) {
  console.warn(
    "VITE_STRIPE_PUBLISHABLE_KEY not configured - Stripe payments disabled"
  );
}

// Khởi tạo Stripe Promise (chỉ khi có public key)
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface PaymentFormProps {
  bookingData: any;
  onPaymentSuccess: () => void;
}

function StripePaymentForm({
  bookingData,
  onPaymentSuccess,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Nếu không có Stripe, hiển thị thông báo
  if (!stripePromise) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-500 rounded-lg">
            <Shield className="text-white" size={20} />
          </div>
          <div>
            <h4 className="font-bold text-red-800 text-lg">
              Thanh toán tạm thời không khả dụng
            </h4>
            <p className="text-red-600 text-sm">
              Vui lòng chọn phương thức thanh toán khác.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleStripePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      // Tạo payment intent cho đặt cọc 30%
      const depositAmount = Math.round(
        parseFloat(bookingData.totalPrice) * 0.3
      );
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: depositAmount,
        bookingId: bookingData.id,
        isDeposit: true,
      });

      const { clientSecret } = await response.json();

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) return;

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (error) {
        toast({
          title: "Lỗi thanh toán",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent?.status === "succeeded") {
        // Cập nhật trạng thái booking
        await apiRequest("POST", "/api/confirm-payment", {
          bookingId: bookingData.id,
          paymentIntentId: paymentIntent.id,
          amount: depositAmount,
        });

        toast({
          title: "Thanh toán thành công!",
          description: "Đặt phòng của bạn đã được xác nhận.",
        });

        onPaymentSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Lỗi thanh toán",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleStripePayment} className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-500 rounded-lg">
            <CreditCard className="text-white" size={20} />
          </div>
          <div>
            <Label
              htmlFor="card-element"
              className="text-lg font-bold text-gray-800"
            >
              Thông tin thẻ tín dụng
            </Label>
            <p className="text-sm text-gray-600">
              Nhập thông tin thẻ để thanh toán
            </p>
          </div>
        </div>

        <div className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50 hover:border-blue-300 transition-colors">
          <CardElement
            id="card-element"
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#374151",
                  fontFamily: "Inter, system-ui, sans-serif",
                  "::placeholder": {
                    color: "#9CA3AF",
                  },
                },
                invalid: {
                  color: "#EF4444",
                },
              },
            }}
          />
        </div>

        <div className="mt-4 flex items-center space-x-2 text-sm text-gray-600">
          <Shield className="text-green-600" size={16} />
          <span>Thanh toán được bảo mật bởi Stripe</span>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Đang xử lý thanh toán...</span>
          </div>
        ) : (
          `Thanh toán ${Math.round(
            parseFloat(bookingData.totalPrice) * 0.3
          ).toLocaleString("vi-VN")} ₫`
        )}
      </Button>
    </form>
  );
}

export default function PaymentMethod() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [roomData, setRoomData] = useState<any>(null);

  const getBookingData = () => {
    const stored = localStorage.getItem("currentBooking");
    if (stored) {
      const data = JSON.parse(stored);
      console.log("Debug - PaymentMethod booking data:", data);
      setBookingData(data);
      return data;
    }
    return null;
  };

  const getRoomData = () => {
    const stored = localStorage.getItem("selectedRoom");
    if (stored) {
      const data = JSON.parse(stored);
      console.log("Debug - PaymentMethod room data:", data);
      setRoomData(data);
      return data;
    }
    return null;
  };

  useEffect(() => {
    const booking = getBookingData();
    const room = getRoomData();

    if (!booking) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin đặt phòng, vui lòng đặt lại",
        variant: "destructive",
      });
      setLocation("/booking");
    }
  }, [toast, setLocation]);

  const handleCashOnArrival = async () => {
    if (!bookingData) return;

    setIsProcessing(true);
    try {
      // If booking already has an ID, update it instead of creating new one
      if (bookingData.id) {
        const response = await apiRequest(
          "PUT",
          `/api/bookings/${bookingData.id}`,
          {
            paymentMethod: "cash",
            status: "confirmed",
          }
        );

        if (response.ok) {
          toast({
            title: "Đặt phòng thành công!",
            description: `Cảm ơn bạn đã đặt phòng. Mã đặt phòng: #HLX${bookingData.id}`,
          });

          localStorage.removeItem("currentBooking");
          queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
          setLocation("/customer");
        } else {
          const error = await response.json();
          throw new Error(error.message);
        }
      } else {
        // Create new booking if no ID exists
        const response = await apiRequest("POST", "/api/bookings", {
          ...bookingData,
          paymentMethod: "cash",
        });

        if (response.ok) {
          const newBooking = await response.json();
          toast({
            title: "Đặt phòng thành công!",
            description: `Cảm ơn bạn đã đặt phòng. Mã đặt phòng: #HLX${newBooking.id}`,
          });

          localStorage.removeItem("currentBooking");
          queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
          setLocation("/customer");
        } else {
          const error = await response.json();
          throw new Error(error.message);
        }
      }
    } catch (error: any) {
      toast({
        title: "Lỗi đặt phòng",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWalletPayment = async () => {
    if (!bookingData) return;

    setIsProcessing(true);
    try {
      // If booking already has an ID, update it instead of creating new one
      if (bookingData.id) {
        const response = await apiRequest(
          "PUT",
          `/api/bookings/${bookingData.id}`,
          {
            paymentMethod: "wallet",
            status: "deposit_paid",
          }
        );

        if (response.ok) {
          toast({
            title: "Đặt phòng thành công!",
            description: `Cảm ơn bạn đã đặt phòng. Mã đặt phòng: #HLX${bookingData.id}`,
          });

          localStorage.removeItem("currentBooking");
          queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
          setLocation("/customer");
        } else {
          const error = await response.json();
          throw new Error(error.message);
        }
      } else {
        // Create new booking if no ID exists
        const response = await apiRequest("POST", "/api/bookings", {
          ...bookingData,
          paymentMethod: "wallet",
          status: "deposit_paid",
        });

        if (response.ok) {
          const newBooking = await response.json();
          toast({
            title: "Đặt phòng thành công!",
            description: `Cảm ơn bạn đã đặt phòng. Mã đặt phòng: #HLX${newBooking.id}`,
          });

          localStorage.removeItem("currentBooking");
          queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
          setLocation("/customer");
        } else {
          const error = await response.json();
          throw new Error(error.message);
        }
      }
    } catch (error: any) {
      toast({
        title: "Lỗi đặt phòng",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const onPaymentSuccess = () => {
    toast({
      title: "Thanh toán thành công!",
      description: `Cảm ơn bạn đã đặt phòng. Mã đặt phòng: #HLX${bookingData.id}`,
    });

    localStorage.removeItem("currentBooking");
    queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    setLocation("/customer");
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => setLocation("/booking")}
            className="mb-6 hover:bg-white/80 backdrop-blur-sm"
          >
            <ArrowLeft className="mr-2" size={16} />
            Quay lại
          </Button>

          <div className="text-center">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Chọn phương thức thanh toán
            </h1>
            <p className="text-muted-foreground text-lg">
              Hoàn tất đặt phòng của bạn một cách an toàn và thuận tiện
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Thông tin đặt phòng - Cột bên trái */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center">
                    <MapPin className="mr-2" size={20} />
                    Chi tiết đặt phòng
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* Thông tin phòng */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">
                        Phòng:
                      </span>
                      <span className="font-semibold text-blue-600">
                        {roomData?.type || bookingData.roomType} -{" "}
                        {roomData?.number || bookingData.roomNumber}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">
                        Nhận phòng:
                      </span>
                      <span className="font-medium">
                        {bookingData.checkIn
                          ? new Date(bookingData.checkIn).toLocaleDateString(
                              "vi-VN"
                            )
                          : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">
                        Trả phòng:
                      </span>
                      <span className="font-medium">
                        {bookingData.checkOut
                          ? new Date(bookingData.checkOut).toLocaleDateString(
                              "vi-VN"
                            )
                          : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Số khách:
                      </span>
                      <span className="font-medium">
                        {bookingData.guests} người
                      </span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Thông tin thanh toán */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Tổng cộng:</span>
                      <span className="text-2xl font-bold text-primary">
                        {bookingData.totalPrice?.toLocaleString("vi-VN")} ₫
                      </span>
                    </div>

                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-orange-700">
                          Đặt cọc (30%):
                        </span>
                        <span className="text-lg font-bold text-orange-600">
                          {Math.round(
                            parseFloat(bookingData.totalPrice) * 0.3
                          ).toLocaleString("vi-VN")}{" "}
                          ₫
                        </span>
                      </div>
                      <p className="text-xs text-orange-600">Thanh toán ngay</p>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-blue-700">
                          Còn lại (70%):
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                          {Math.round(
                            parseFloat(bookingData.totalPrice) * 0.7
                          ).toLocaleString("vi-VN")}{" "}
                          ₫
                        </span>
                      </div>
                      <p className="text-xs text-blue-600">
                        Thanh toán khi check-in
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Phương thức thanh toán - Cột bên phải */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2" size={20} />
                    Phương thức thanh toán
                  </CardTitle>
                  <div className="text-sm text-white/90">
                    Đang chọn:{" "}
                    <strong>
                      {paymentMethod === "stripe"
                        ? "Thẻ tín dụng"
                        : paymentMethod === "cash"
                        ? "Thanh toán khi nhận phòng"
                        : "Ví điện tử"}
                    </strong>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => {
                      console.log("Payment method changed to:", value);
                      setPaymentMethod(value);
                    }}
                    className="space-y-4"
                  >
                    {/* Thanh toán thẻ */}
                    <div
                      className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                        paymentMethod === "stripe"
                          ? "border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-blue-200"
                          : "border-gray-200 hover:border-blue-300 bg-white hover:bg-blue-50/50"
                      }`}
                      onClick={() => setPaymentMethod("stripe")}
                    >
                      <RadioGroupItem
                        value="stripe"
                        id="stripe"
                        className="absolute top-4 right-4"
                      />
                      <div className="flex items-start space-x-4">
                        <div
                          className={`p-3 rounded-lg ${
                            paymentMethod === "stripe"
                              ? "bg-blue-500"
                              : "bg-blue-100"
                          }`}
                        >
                          <CreditCard
                            className={`${
                              paymentMethod === "stripe"
                                ? "text-white"
                                : "text-blue-600"
                            }`}
                            size={24}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">
                              Thẻ tín dụng/ghi nợ
                            </h3>
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-700"
                            >
                              Đặt cọc 30%
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Visa, MasterCard, JCB - Thanh toán an toàn và nhanh
                            chóng
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Shield className="text-green-600" size={14} />
                            <span>Bảo mật SSL 256-bit</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Thanh toán khi nhận phòng */}
                    <div
                      className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                        paymentMethod === "cash"
                          ? "border-green-500 bg-gradient-to-r from-green-50 to-green-100 shadow-green-200"
                          : "border-gray-200 hover:border-green-300 bg-white hover:bg-green-50/50"
                      }`}
                      onClick={() => setPaymentMethod("cash")}
                    >
                      <RadioGroupItem
                        value="cash"
                        id="cash"
                        className="absolute top-4 right-4"
                      />
                      <div className="flex items-start space-x-4">
                        <div
                          className={`p-3 rounded-lg ${
                            paymentMethod === "cash"
                              ? "bg-green-500"
                              : "bg-green-100"
                          }`}
                        >
                          <MapPin
                            className={`${
                              paymentMethod === "cash"
                                ? "text-white"
                                : "text-green-600"
                            }`}
                            size={24}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">
                              Thanh toán khi nhận phòng
                            </h3>
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700"
                            >
                              Tiện lợi
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            Thanh toán bằng tiền mặt tại khách sạn khi check-in
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <MapPin className="text-green-600" size={14} />
                            <span>Không cần thanh toán trước</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Ví điện tử */}
                    <div
                      className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                        paymentMethod === "wallet"
                          ? "border-purple-500 bg-gradient-to-r from-purple-50 to-purple-100 shadow-purple-200"
                          : "border-gray-200 hover:border-purple-300 bg-white hover:bg-purple-50/50"
                      }`}
                      onClick={() => setPaymentMethod("wallet")}
                    >
                      <RadioGroupItem
                        value="wallet"
                        id="wallet"
                        className="absolute top-4 right-4"
                      />
                      <div className="flex items-start space-x-4">
                        <div
                          className={`p-3 rounded-lg ${
                            paymentMethod === "wallet"
                              ? "bg-purple-500"
                              : "bg-purple-100"
                          }`}
                        >
                          <Wallet
                            className={`${
                              paymentMethod === "wallet"
                                ? "text-white"
                                : "text-purple-600"
                            }`}
                            size={24}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">
                              Ví điện tử
                            </h3>
                            <Badge
                              variant="secondary"
                              className="bg-purple-100 text-purple-700"
                            >
                              Đặt cọc 30%
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            MoMo, ZaloPay, ViettelPay - Thanh toán nhanh chóng
                            và tiện lợi
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Wallet className="text-purple-600" size={14} />
                            <span>QR Code thanh toán</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>

                  <motion.div
                    className="mt-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {paymentMethod === "stripe" &&
                      (stripePromise ? (
                        <div className="space-y-6">
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="p-2 bg-blue-500 rounded-lg">
                                <Shield className="text-white" size={20} />
                              </div>
                              <div>
                                <h4 className="font-bold text-blue-800 text-lg">
                                  Thanh toán an toàn
                                </h4>
                                <p className="text-blue-600 text-sm">
                                  Bảo mật SSL 256-bit - Chấp nhận Visa,
                                  MasterCard, JCB
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="bg-white p-3 rounded-lg">
                                <div className="font-semibold text-blue-700">
                                  Đặt cọc ngay
                                </div>
                                <div className="text-2xl font-bold text-blue-600">
                                  {Math.round(
                                    parseFloat(bookingData.totalPrice) * 0.3
                                  ).toLocaleString("vi-VN")}{" "}
                                  ₫
                                </div>
                                <div className="text-xs text-blue-500">
                                  30% tổng tiền
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded-lg">
                                <div className="font-semibold text-gray-600">
                                  Còn lại
                                </div>
                                <div className="text-2xl font-bold text-gray-700">
                                  {Math.round(
                                    parseFloat(bookingData.totalPrice) * 0.7
                                  ).toLocaleString("vi-VN")}{" "}
                                  ₫
                                </div>
                                <div className="text-xs text-gray-500">
                                  Thanh toán khi check-in
                                </div>
                              </div>
                            </div>
                          </div>

                          <Elements stripe={stripePromise}>
                            <StripePaymentForm
                              bookingData={bookingData}
                              onPaymentSuccess={onPaymentSuccess}
                            />
                          </Elements>
                        </div>
                      ) : (
                        <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-red-500 rounded-lg">
                              <Shield className="text-white" size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-red-800 text-lg">
                                Thanh toán tạm thời không khả dụng
                              </h4>
                              <p className="text-red-600 text-sm">
                                Vui lòng chọn phương thức thanh toán khác.
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                    {paymentMethod === "cash" && (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-green-500 rounded-lg">
                              <MapPin className="text-white" size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-green-800 text-lg">
                                Thanh toán tại khách sạn
                              </h4>
                              <p className="text-green-600 text-sm">
                                Không cần thanh toán trước - Tiện lợi và an toàn
                              </p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2 text-sm text-green-700">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>
                                Thanh toán đầy đủ khi làm thủ tục nhận phòng
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-green-700">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>
                                Chấp nhận tiền mặt và thẻ tại quầy lễ tân
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-green-700">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>Đặt phòng sẽ được giữ trong 24 giờ</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={handleCashOnArrival}
                          className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Đang xử lý...</span>
                            </div>
                          ) : (
                            "Xác nhận đặt phòng"
                          )}
                        </Button>
                      </div>
                    )}

                    {paymentMethod === "wallet" && (
                      <div className="space-y-6">
                        {/* Chọn ví điện tử */}
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="p-2 bg-purple-500 rounded-lg">
                              <Wallet className="text-white" size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-purple-800 text-lg">
                                Chọn ví điện tử
                              </h4>
                              <p className="text-purple-600 text-sm">
                                Thanh toán nhanh chóng và tiện lợi
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-lg border-2 border-pink-200 hover:border-pink-400 cursor-pointer transition-all duration-300 hover:shadow-lg">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-md">
                                  <span className="text-white font-bold text-lg">
                                    M
                                  </span>
                                </div>
                                <span className="text-sm font-semibold text-gray-700">
                                  MoMo
                                </span>
                              </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-blue-200 hover:border-blue-400 cursor-pointer transition-all duration-300 hover:shadow-lg">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-md">
                                  <span className="text-white font-bold text-lg">
                                    Z
                                  </span>
                                </div>
                                <span className="text-sm font-semibold text-gray-700">
                                  ZaloPay
                                </span>
                              </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-red-200 hover:border-red-400 cursor-pointer transition-all duration-300 hover:shadow-lg">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-md">
                                  <span className="text-white font-bold text-lg">
                                    V
                                  </span>
                                </div>
                                <span className="text-sm font-semibold text-gray-700">
                                  ViettelPay
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* QR Code Section */}
                        <div className="bg-white p-8 rounded-xl border border-gray-200 text-center shadow-lg">
                          <div className="flex items-center justify-center space-x-3 mb-6">
                            <div className="p-2 bg-purple-500 rounded-lg">
                              <Wallet className="text-white" size={20} />
                            </div>
                            <h3 className="font-bold text-xl text-gray-800">
                              Quét mã QR để thanh toán
                            </h3>
                          </div>

                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 mb-6">
                            <div className="w-64 h-80 bg-white rounded-xl mx-auto p-4 shadow-lg">
                              <img
                                src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=DANG%20VAN%20HOANG%20-%200389597728"
                                alt="QR Code VietQR - DANG VAN HOANG"
                                className="w-full h-full object-contain rounded-lg"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-orange-800">
                                  Số tiền chuyển khoản:
                                </span>
                                <span className="text-2xl font-bold text-orange-600">
                                  {Math.round(
                                    parseFloat(bookingData.totalPrice) * 0.3
                                  ).toLocaleString("vi-VN")}{" "}
                                  ₫
                                </span>
                              </div>
                              <div className="text-sm text-orange-700">
                                <p>
                                  Tài khoản:{" "}
                                  <span className="font-semibold">
                                    DANG VAN HOANG - 0389597728
                                  </span>
                                </p>
                                <p className="text-xs mt-1">
                                  (Đặt cọc 30% - còn lại 70% thanh toán khi
                                  check-in)
                                </p>
                              </div>
                            </div>

                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-blue-800">
                                  Nội dung chuyển khoản:
                                </span>
                                <span className="font-mono font-bold text-blue-600 text-lg">
                                  HLX{bookingData.id}
                                </span>
                              </div>
                              <p className="text-sm text-blue-700">
                                (Vui lòng ghi chính xác nội dung chuyển khoản)
                              </p>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-600">
                                💡 Quét mã QR bằng app ngân hàng hoặc ví điện tử
                              </p>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={handleWalletPayment}
                          className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Đang xử lý...</span>
                            </div>
                          ) : (
                            "Tôi đã chuyển khoản"
                          )}
                        </Button>

                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                          <p className="text-sm text-center text-blue-700">
                            💡 Sau khi chuyển khoản thành công, nhấn nút "Tôi đã
                            chuyển khoản" để xác nhận
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
