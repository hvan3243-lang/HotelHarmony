import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Wallet, MapPin, Shield, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
// Import Stripe với cấu hình an toàn
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { apiRequest } from "@/lib/queryClient";

// Kiểm tra public key có tồn tại không
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (!stripePublicKey) {
  console.warn('VITE_STRIPE_PUBLIC_KEY not configured');
}

// Khởi tạo Stripe Promise (chỉ khi có public key)
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface PaymentFormProps {
  bookingData: any;
  onPaymentSuccess: () => void;
}

function StripePaymentForm({ bookingData, onPaymentSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStripePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;
    
    setIsProcessing(true);
    
    try {
      // Tạo payment intent
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: bookingData.totalPrice,
        bookingId: bookingData.id
      });
      
      const { clientSecret } = await response.json();
      
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) return;
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });
      
      if (error) {
        toast({
          title: "Lỗi thanh toán",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent?.status === 'succeeded') {
        // Cập nhật trạng thái booking
        await apiRequest("POST", "/api/confirm-payment", {
          bookingId: bookingData.id,
          paymentMethod: "stripe",
          paymentIntentId: paymentIntent.id
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
    <form onSubmit={handleStripePayment} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? "Đang xử lý..." : `Thanh toán ${bookingData.totalPrice?.toLocaleString('vi-VN')} VNĐ`}
      </Button>
    </form>
  );
}

export default function PaymentMethod() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Lấy booking data từ localStorage hoặc state
  const getBookingData = () => {
    const storedBooking = localStorage.getItem('currentBooking');
    if (storedBooking) {
      return JSON.parse(storedBooking);
    }
    
    // Fallback data
    return {
      id: null,
      roomNumber: "101",
      roomType: "Standard",
      checkIn: "2025-01-15",
      checkOut: "2025-01-17", 
      guests: 2,
      totalPrice: 500000,
      customerName: "Khách hàng",
      customerEmail: "customer@example.com",
      customerPhone: "0123456789"
    };
  };
  
  const bookingData = getBookingData();

  const handleCashOnArrival = async () => {
    if (!bookingData.id) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin đặt phòng. Vui lòng đặt phòng lại.",
        variant: "destructive",
      });
      setLocation("/booking");
      return;
    }

    setIsProcessing(true);
    try {
      await apiRequest("POST", "/api/confirm-payment", {
        bookingId: bookingData.id,
        paymentMethod: "cash_on_arrival",
        status: "pending"
      });
      
      toast({
        title: "Đặt phòng thành công!",
        description: `Bạn sẽ thanh toán khi nhận phòng. Mã đặt phòng: #HLX${bookingData.id}`,
      });
      
      // Xóa dữ liệu booking tạm thời
      localStorage.removeItem('currentBooking');
      setLocation("/customer");
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
    if (!bookingData.id) {
      toast({
        title: "Lỗi",
        description: "Không tìm thấy thông tin đặt phòng. Vui lòng đặt phòng lại.",
        variant: "destructive",
      });
      setLocation("/booking");
      return;
    }

    setIsProcessing(true);
    try {
      // Giả lập thanh toán ví điện tử
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await apiRequest("POST", "/api/confirm-payment", {
        bookingId: bookingData.id,
        paymentMethod: "e_wallet",
        status: "confirmed"
      });
      
      toast({
        title: "Thanh toán ví thành công!",
        description: `Đặt phòng đã được xác nhận. Mã đặt phòng: #HLX${bookingData.id}`,
      });
      
      // Xóa dữ liệu booking tạm thời
      localStorage.removeItem('currentBooking');
      setLocation("/customer");
    } catch (error: any) {
      toast({
        title: "Lỗi thanh toán ví",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const onPaymentSuccess = () => {
    setLocation("/customer");
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/booking")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2" size={16} />
            Quay lại
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Chọn phương thức thanh toán</h1>
          <p className="text-muted-foreground">Hoàn tất đặt phòng của bạn</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Thông tin đặt phòng */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Chi tiết đặt phòng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Phòng:</span>
                  <span className="font-semibold">{bookingData.roomNumber} - {bookingData.roomType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nhận phòng:</span>
                  <span>{bookingData.checkIn}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trả phòng:</span>
                  <span>{bookingData.checkOut}</span>
                </div>
                <div className="flex justify-between">
                  <span>Số khách:</span>
                  <span>{bookingData.guests} người</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">{bookingData.totalPrice?.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Phương thức thanh toán */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Phương thức thanh toán</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  {/* Thanh toán thẻ */}
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="stripe" id="stripe" />
                    <Label htmlFor="stripe" className="flex items-center space-x-2 cursor-pointer flex-1">
                      <CreditCard className="text-blue-600" size={20} />
                      <div>
                        <div className="font-semibold">Thẻ tín dụng/ghi nợ</div>
                        <div className="text-sm text-muted-foreground">Visa, MasterCard, JCB</div>
                      </div>
                    </Label>
                    <Shield className="text-green-600" size={16} />
                  </div>

                  {/* Thanh toán khi nhận phòng */}
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex items-center space-x-2 cursor-pointer flex-1">
                      <MapPin className="text-green-600" size={20} />
                      <div>
                        <div className="font-semibold">Thanh toán khi nhận phòng</div>
                        <div className="text-sm text-muted-foreground">Thanh toán bằng tiền mặt tại khách sạn</div>
                      </div>
                    </Label>
                  </div>

                  {/* Ví điện tử */}
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="wallet" id="wallet" />
                    <Label htmlFor="wallet" className="flex items-center space-x-2 cursor-pointer flex-1">
                      <Wallet className="text-purple-600" size={20} />
                      <div>
                        <div className="font-semibold">Ví điện tử</div>
                        <div className="text-sm text-muted-foreground">MoMo, ZaloPay, ViettelPay</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                <div className="mt-6">
                  {paymentMethod === "stripe" && (
                    stripePromise ? (
                      <Elements stripe={stripePromise}>
                        <StripePaymentForm 
                          bookingData={bookingData} 
                          onPaymentSuccess={onPaymentSuccess}
                        />
                      </Elements>
                    ) : (
                      <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-800 dark:text-red-200">
                          Stripe chưa được cấu hình. Vui lòng chọn phương thức thanh toán khác.
                        </p>
                      </div>
                    )
                  )}

                  {paymentMethod === "cash" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                          Lưu ý thanh toán khi nhận phòng:
                        </h4>
                        <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                          <li>• Vui lòng thanh toán đầy đủ khi làm thủ tục nhận phòng</li>
                          <li>• Chấp nhận tiền mặt và thẻ tại quầy lễ tân</li>
                          <li>• Đặt phòng sẽ được giữ trong 24 giờ</li>
                        </ul>
                      </div>
                      <Button 
                        onClick={handleCashOnArrival} 
                        className="w-full"
                        disabled={isProcessing}
                      >
                        {isProcessing ? "Đang xử lý..." : "Xác nhận đặt phòng"}
                      </Button>
                    </div>
                  )}

                  {paymentMethod === "wallet" && (
                    <div className="space-y-4">
                      <div className="p-4 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg">
                        <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                          Thanh toán ví điện tử:
                        </h4>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          Bạn sẽ được chuyển đến ứng dụng ví để hoàn tất thanh toán
                        </p>
                      </div>
                      <Button 
                        onClick={handleWalletPayment} 
                        className="w-full"
                        disabled={isProcessing}
                      >
                        {isProcessing ? "Đang xử lý..." : "Thanh toán bằng ví điện tử"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}