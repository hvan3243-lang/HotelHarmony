import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle, Calendar, Users, Bed, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

const CheckoutForm = ({ booking, totalAmount }: { booking: any; totalAmount: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  const confirmPaymentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/confirm-payment", data),
    onSuccess: () => {
      toast({
        title: "Thanh toán thành công!",
        description: "Cảm ơn bạn đã đặt phòng tại HotelLux",
      });
      setLocation("/customer");
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi xác nhận thanh toán",
        description: error.message || "Có lỗi xảy ra khi xác nhận thanh toán",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/customer",
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Thanh toán thất bại",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    } else {
      // Payment succeeded
      confirmPaymentMutation.mutate({ bookingId: booking.id });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg">
        <PaymentElement />
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        disabled={!stripe || isProcessing || confirmPaymentMutation.isPending}
      >
        {isProcessing || confirmPaymentMutation.isPending ? (
          <div className="flex items-center">
            <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
            Đang xử lý thanh toán...
          </div>
        ) : (
          <div className="flex items-center">
            <CreditCard className="mr-2" size={20} />
            Thanh toán {new Intl.NumberFormat('vi-VN').format(totalAmount)}đ
          </div>
        )}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    const user = authManager.getUser();
    if (!user) {
      setLocation("/auth");
      return;
    }
  }, [setLocation]);

  const { data: booking, isLoading } = useQuery({
    queryKey: [`/api/bookings`],
    select: (bookings: any[]) => {
      return bookings.find(b => b.id === parseInt(params.bookingId || "0"));
    },
    enabled: !!params.bookingId,
  });

  useEffect(() => {
    if (booking && !clientSecret) {
      // Create PaymentIntent as soon as the booking is loaded
      const createPaymentIntent = async () => {
        try {
          const response = await apiRequest("POST", "/api/create-payment-intent", { 
            amount: parseFloat(booking.totalPrice),
            bookingId: booking.id,
          });
          const data = await response.json();
          setClientSecret(data.clientSecret);
        } catch (error: any) {
          toast({
            title: "Lỗi khởi tạo thanh toán",
            description: error.message || "Có lỗi xảy ra khi khởi tạo thanh toán",
            variant: "destructive",
          });
        }
      };

      createPaymentIntent();
    }
  }, [booking, clientSecret, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải thông tin đặt phòng...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Không tìm thấy đặt phòng</h2>
            <p className="text-muted-foreground mb-4">
              Đặt phòng này không tồn tại hoặc bạn không có quyền truy cập.
            </p>
            <Button onClick={() => setLocation("/")}>
              Về trang chủ
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Đang khởi tạo thanh toán...</p>
        </div>
      </div>
    );
  }

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('vi-VN').format(parseFloat(price)) + "đ";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    });
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

  const calculateNights = () => {
    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const basePrice = parseFloat(booking.totalPrice) / 1.1; // Remove tax to get base price
  const tax = parseFloat(booking.totalPrice) - basePrice;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-center mb-2">
            <CreditCard className="inline mr-3" />
            Thanh Toán Đặt Phòng
          </h1>
          <p className="text-center text-muted-foreground">
            Hoàn tất thanh toán để xác nhận đặt phòng của bạn
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Booking Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="mr-2" size={20} />
                  Thông Tin Đặt Phòng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Room Info */}
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">
                      {getRoomTypeLabel(booking.room.type)}
                    </h3>
                    <Badge>Phòng {booking.room.number}</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {booking.room.description}
                  </p>
                </div>

                <Separator />

                {/* Dates */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Calendar className="mr-3 text-primary" size={16} />
                    <div>
                      <p className="font-medium">Check-in</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(booking.checkIn)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-3 text-primary" size={16} />
                    <div>
                      <p className="font-medium">Check-out</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(booking.checkOut)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Bed className="mr-3 text-primary" size={16} />
                    <div>
                      <p className="font-medium">{nights} đêm</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Users className="mr-3 text-primary" size={16} />
                    <div>
                      <p className="font-medium">{booking.guests} khách</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Amenities */}
                <div>
                  <h4 className="font-medium mb-2">Tiện nghi phòng</h4>
                  <div className="flex flex-wrap gap-2">
                    {booking.room.amenities.map((amenity: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Special Requests */}
                {booking.specialRequests && (
                  <>
                    <div>
                      <h4 className="font-medium mb-2">Yêu cầu đặc biệt</h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        {booking.specialRequests}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <h4 className="font-medium">Chi tiết giá</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{formatPrice((basePrice / nights).toString())} x {nights} đêm</span>
                      <span>{formatPrice(basePrice.toString())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Thuế & phí dịch vụ (10%)</span>
                      <span>{formatPrice(tax.toString())}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-base">
                      <span>Tổng cộng</span>
                      <span className="text-primary">
                        {formatPrice(booking.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hotel Info */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <MapPin className="mr-2 text-primary" size={16} />
                    <h4 className="font-medium">HotelLux Resort</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Khách sạn 5 sao sang trọng tại trung tâm thành phố
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2" size={20} />
                  Thông Tin Thanh Toán
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!import.meta.env.VITE_STRIPE_PUBLIC_KEY ? (
                  <div className="text-center py-8">
                    <CreditCard className="mx-auto mb-4 text-muted-foreground" size={48} />
                    <h3 className="text-lg font-semibold mb-2">Stripe chưa được cấu hình</h3>
                    <p className="text-muted-foreground mb-4">
                      Vui lòng cấu hình VITE_STRIPE_PUBLIC_KEY để sử dụng tính năng thanh toán.
                    </p>
                    <Button onClick={() => setLocation("/customer")}>
                      Quay lại trang khách hàng
                    </Button>
                  </div>
                ) : (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm 
                      booking={booking} 
                      totalAmount={parseFloat(booking.totalPrice)} 
                    />
                  </Elements>
                )}
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card className="mt-6">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-green-600" size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Thanh toán an toàn</h4>
                    <p className="text-xs text-muted-foreground">
                      Thông tin thẻ của bạn được mã hóa và bảo mật bởi Stripe
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
