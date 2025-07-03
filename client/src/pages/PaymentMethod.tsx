import { useState, useEffect } from "react";
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
      // Tạo payment intent cho đặt cọc 30%
      const depositAmount = Math.round(parseFloat(bookingData.totalPrice) * 0.3);
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: depositAmount,
        bookingId: bookingData.id,
        isDeposit: true
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
          paymentIntentId: paymentIntent.id,
          isDeposit: true
        });
        
        toast({
          title: "Đặt cọc thành công!",
          description: "Bạn đã đặt cọc 30%. Vui lòng thanh toán 70% còn lại khi check-in.",
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
  
  // Lấy booking data từ localStorage
  const getBookingData = () => {
    const storedBooking = localStorage.getItem('currentBooking');
    if (storedBooking) {
      try {
        return JSON.parse(storedBooking);
      } catch (e) {
        console.error('Error parsing booking data:', e);
        return null;
      }
    }
    return null;
  };
  
  const bookingData = getBookingData();

  // Redirect if no booking data
  useEffect(() => {
    if (!bookingData) {
      toast({
        title: "Không tìm thấy thông tin đặt phòng",
        description: "Vui lòng đặt phòng lại",
        variant: "destructive",
      });
      setLocation('/booking');
    }
  }, [bookingData, toast, setLocation]);

  // Don't render if no booking data
  if (!bookingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  const handleCashOnArrival = async () => {
    if (!bookingData || !bookingData.id) {
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
      // Giả lập thanh toán ví điện tử cho đặt cọc 30%
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await apiRequest("POST", "/api/confirm-payment", {
        bookingId: bookingData.id,
        paymentMethod: "e_wallet",
        status: "confirmed",
        isDeposit: true
      });
      
      toast({
        title: "Đặt cọc ví thành công!",
        description: `Bạn đã đặt cọc 30%. Vui lòng thanh toán 70% còn lại khi check-in. Mã đặt phòng: #HLX${bookingData.id}`,
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
                <div className="space-y-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng cộng:</span>
                    <span className="text-primary">{bookingData.totalPrice?.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Đặt cọc (30%):</span>
                    <span className="text-orange-600 font-semibold">{Math.round(parseFloat(bookingData.totalPrice) * 0.3).toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Còn lại (70% - thanh toán khi check-in):</span>
                    <span className="text-blue-600 font-semibold">{Math.round(parseFloat(bookingData.totalPrice) * 0.7).toLocaleString('vi-VN')} VNĐ</span>
                  </div>
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
                        <div className="font-semibold">Thẻ tín dụng/ghi nợ (Đặt cọc 30%)</div>
                        <div className="text-sm text-muted-foreground">Visa, MasterCard, JCB - Thanh toán 70% còn lại khi check-in</div>
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
                        <div className="font-semibold">Ví điện tử (Đặt cọc 30%)</div>
                        <div className="text-sm text-muted-foreground">MoMo, ZaloPay, ViettelPay - Thanh toán 70% còn lại khi check-in</div>
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
                      {/* Chọn ví điện tử */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="border rounded-lg p-4 hover:bg-muted cursor-pointer transition-colors border-purple-200 bg-purple-50">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                              <span className="text-pink-600 font-bold text-lg">M</span>
                            </div>
                            <span className="text-sm font-medium">MoMo</span>
                          </div>
                        </div>
                        <div className="border rounded-lg p-4 hover:bg-muted cursor-pointer transition-colors">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                              <span className="text-blue-600 font-bold text-lg">Z</span>
                            </div>
                            <span className="text-sm font-medium">ZaloPay</span>
                          </div>
                        </div>
                        <div className="border rounded-lg p-4 hover:bg-muted cursor-pointer transition-colors">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                              <span className="text-red-600 font-bold text-lg">V</span>
                            </div>
                            <span className="text-sm font-medium">ViettelPay</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* QR Code Section */}
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border text-center shadow-sm">
                        <h3 className="font-semibold mb-4 text-lg">Quét mã QR để thanh toán</h3>
                        <div className="w-64 h-80 bg-white rounded-lg mx-auto mb-4 p-2 shadow-md">
                          <img 
                            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                            alt="QR Code VietQR - DANG VAN HOANG" 
                            className="w-full h-full object-contain rounded-lg bg-gray-100"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.background = 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)';
                              target.style.backgroundSize = '20px 20px';
                              target.style.backgroundPosition = '0 0, 0 10px, 10px -10px, -10px 0px';
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm font-medium">
                            <div className="text-center bg-white/90 p-4 rounded-lg">
                              <div className="font-bold text-lg mb-2">QR CODE THANH TOÁN</div>
                              <div className="text-sm">DANG VAN HOANG</div>
                              <div className="text-sm">0389597728</div>
                              <div className="text-xs mt-2 text-gray-500">
                                Quét bằng app ngân hàng để thanh toán
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg border border-red-200 dark:border-red-800">
                            <p className="text-red-800 dark:text-red-200 font-medium">
                              Chuyển khoản: <span className="font-bold">{Math.round(parseFloat(bookingData.totalPrice) * 0.3).toLocaleString('vi-VN')} VNĐ</span>
                            </p>
                            <p className="text-red-700 dark:text-red-300 text-sm">
                              Tài khoản: DANG VAN HOANG - 0389597728
                            </p>
                            <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                              (Đặt cọc 30% - còn lại 70% thanh toán khi check-in)
                            </p>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-blue-800 dark:text-blue-200 font-medium">
                              Nội dung: <span className="font-mono font-bold">HLX{bookingData.id}</span>
                            </p>
                            <p className="text-blue-700 dark:text-blue-300 text-sm">
                              (Vui lòng ghi chính xác nội dung chuyển khoản)
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Quét mã QR bằng app ngân hàng hoặc ví điện tử
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleWalletPayment} 
                        className="w-full"
                        disabled={isProcessing}
                      >
                        {isProcessing ? "Đang xử lý..." : "Tôi đã chuyển khoản"}
                      </Button>
                      
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        Sau khi chuyển khoản thành công, nhấn nút "Tôi đã chuyển khoản" để xác nhận
                      </p>
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