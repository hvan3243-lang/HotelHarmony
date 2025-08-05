import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import { useState } from "react";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Hàm lấy thông tin user hiện tại từ localStorage (giả định đã lưu sau đăng nhập)
function getCurrentUserInfo() {
  try {
    const user = localStorage.getItem("user");
    if (user) return JSON.parse(user);
  } catch {}
  return null;
}

export function WebsiteChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Xin chào! Tôi là Website Assistant. Tôi có thể giúp bạn về thông tin website, hướng dẫn sử dụng, hoặc hỗ trợ kỹ thuật. Bạn cần hỏi gì?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  // Thêm các state cho quy trình đặt phòng tự động
  const [bookingStep, setBookingStep] = useState<null | number>(null);
  const [bookingInfo, setBookingInfo] = useState<{
    name?: string;
    checkIn?: string;
    checkOut?: string;
    roomType?: string;
    guests?: string;
  }>({});
  const roomTypes = ["Standard", "Deluxe", "Suite", "Presidential"];

  const resetBooking = () => {
    setBookingStep(null);
    setBookingInfo({});
  };

  const quickActions = [
    "Giới thiệu website",
    "Hướng dẫn sử dụng",
    "Hỗ trợ kỹ thuật",
    "Liên hệ quản trị viên",
  ];

  // Thông tin tổng quan về website để nhúng vào prompt AI
  const WEBSITE_CONTEXT = `
Website HotelHarmony (HotelLux) là hệ thống quản lý khách sạn hiện đại, hỗ trợ đặt phòng, quản lý, thanh toán, đánh giá, blog, liên hệ, đa ngôn ngữ. Các chức năng chính:
- Đặt phòng khách sạn trực tuyến
- Quản lý phòng, khách hàng, booking, thanh toán
- Dashboard cho admin với thống kê, báo cáo
- Hỗ trợ nhiều ngôn ngữ (Việt/Anh)
- Tích hợp thanh toán Stripe
- Đánh giá, xếp hạng phòng
- Blog, tin tức, liên hệ hỗ trợ
- Dịch vụ: Wifi, bãi đỗ xe, nhà hàng, lễ tân, v.v.
- Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM | Điện thoại: +84 123 456 789 | Email: info@hotellux.com
Hãy trả lời các câu hỏi về website này một cách thân thiện, chính xác, ngắn gọn và dễ hiểu cho người dùng phổ thông.`;

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    // Nếu đang trong quy trình đặt phòng
    if (bookingStep !== null) {
      handleBookingStep(text);
      return;
    }

    // Lấy thông tin user hiện tại
    const userInfo = getCurrentUserInfo();

    // Kiểm tra ý định đặt phòng
    const lowerText = text.toLowerCase();
    if (
      lowerText.includes("đặt phòng") ||
      lowerText.includes("book room") ||
      lowerText.includes("booking")
    ) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "Tôi sẽ giúp bạn đặt phòng. Bạn vui lòng cho biết tên của bạn?",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
      setBookingStep(0);
      return;
    }

    // Gọi API Gemini như cũ cho các câu hỏi khác
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        text: "Đang lấy câu trả lời từ AI...",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          userInfo: userInfo
            ? {
                name: userInfo.firstName || userInfo.name || "",
                email: userInfo.email || "",
              }
            : null,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: Date.now() + 2,
          text: data.answer || "Không nhận được phản hồi từ AI.",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          id: Date.now() + 3,
          text: "Lỗi khi kết nối AI. Vui lòng thử lại sau.",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  };

  // Xử lý từng bước đặt phòng
  const handleBookingStep = async (text: string) => {
    if (bookingStep === 0) {
      setBookingInfo((info) => ({ ...info, name: text }));
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          text: "Bạn muốn nhận phòng ngày nào? (YYYY-MM-DD)",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
      setBookingStep(1);
    } else if (bookingStep === 1) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(text.trim())) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 20,
            text: "Định dạng ngày không hợp lệ. Vui lòng nhập lại theo dạng YYYY-MM-DD (ví dụ: 2024-07-01).",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
        return;
      }
      setBookingInfo((info) => ({ ...info, checkIn: text }));
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 3,
          text: "Bạn sẽ trả phòng ngày nào? (YYYY-MM-DD)",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
      setBookingStep(2);
    } else if (bookingStep === 2) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(text.trim())) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 21,
            text: "Định dạng ngày không hợp lệ. Vui lòng nhập lại theo dạng YYYY-MM-DD (ví dụ: 2024-07-02).",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
        return;
      }
      setBookingInfo((info) => ({ ...info, checkOut: text }));
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 4,
          text: `Bạn muốn đặt loại phòng nào? (${roomTypes.join(", ")})`,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
      setBookingStep(3);
    } else if (bookingStep === 3) {
      setBookingInfo((info) => ({ ...info, roomType: text }));
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 5,
          text: "Bạn muốn đặt cho bao nhiêu khách?",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
      setBookingStep(4);
    } else if (bookingStep === 4) {
      setBookingInfo((info) => ({ ...info, guests: text }));
      // Xác nhận lại thông tin
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 6,
          text: `Vui lòng xác nhận thông tin đặt phòng:\n- Tên: ${bookingInfo.name}\n- Nhận phòng: ${bookingInfo.checkIn}\n- Trả phòng: ${bookingInfo.checkOut}\n- Loại phòng: ${bookingInfo.roomType}\n- Số khách: ${text}\n\nNhập 'Xác nhận' để hoàn tất hoặc 'Hủy' để bỏ qua.`,
          isUser: false,
          timestamp: new Date(),
        },
      ]);
      setBookingStep(5);
    } else if (bookingStep === 5) {
      if (text.toLowerCase().includes("xác nhận")) {
        // Kiểm tra phòng trống trước khi tạo booking
        try {
          const checkRes = await fetch(
            `/api/rooms?checkIn=${bookingInfo.checkIn}&checkOut=${bookingInfo.checkOut}`
          );
          const availableRooms = checkRes.ok ? await checkRes.json() : [];
          const matchedRoom = availableRooms.find(
            (r: any) =>
              r.type?.toLowerCase() ===
              (bookingInfo.roomType || "").toLowerCase()
          );
          if (!matchedRoom) {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + 12,
                text: `Rất tiếc, loại phòng bạn chọn không còn trống trong thời gian này. Vui lòng chọn loại phòng khác hoặc đổi ngày.`,
                isUser: false,
                timestamp: new Date(),
              },
            ]);
            setBookingStep(3); // Quay lại bước chọn loại phòng
            return;
          }
          // Lấy token nếu có
          const token = localStorage.getItem("token");
          console.log("DEBUG token gửi booking:", token);
          // Gọi API tạo booking
          const res = await fetch("/api/bookings", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              name: bookingInfo.name,
              checkIn: bookingInfo.checkIn,
              checkOut: bookingInfo.checkOut,
              roomType: bookingInfo.roomType,
              guests: bookingInfo.guests,
            }),
          });
          if (res.ok) {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + 7,
                text: `Đặt phòng thành công! Cảm ơn bạn, ${bookingInfo.name}. Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.`,
                isUser: false,
                timestamp: new Date(),
              },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now() + 8,
                text: "Đặt phòng thất bại. Vui lòng thử lại sau hoặc liên hệ lễ tân.",
                isUser: false,
                timestamp: new Date(),
              },
            ]);
          }
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 9,
              text: "Lỗi khi kết nối hệ thống đặt phòng. Vui lòng thử lại sau.",
              isUser: false,
              timestamp: new Date(),
            },
          ]);
        }
        resetBooking();
      } else if (text.toLowerCase().includes("hủy")) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 10,
            text: "Đặt phòng đã được hủy. Nếu bạn muốn đặt lại, hãy nhấn 'Đặt phòng' hoặc nhập lại thông tin.",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
        resetBooking();
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 11,
            text: "Vui lòng nhập 'Xác nhận' để hoàn tất hoặc 'Hủy' để bỏ qua.",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              size="lg"
              className="w-16 h-16 rounded-full shadow-lg"
              onClick={() => setIsOpen(true)}
            >
              <MessageCircle size={24} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 left-0 w-80 max-w-[calc(100vw-2rem)]"
          >
            <Card className="shadow-2xl border-2">
              <CardHeader className="bg-primary text-primary-foreground p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                      <Bot size={16} />
                    </div>
                    <div>
                      <CardTitle className="text-sm">
                        Website Assistant
                      </CardTitle>
                      <p className="text-xs opacity-90">Trực tuyến</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => setIsOpen(false)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {/* Messages */}
                <div className="h-80 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-start space-x-3 ${
                        message.isUser ? "justify-end" : ""
                      }`}
                    >
                      {!message.isUser && (
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot size={16} className="text-primary" />
                        </div>
                      )}
                      <div
                        className={`rounded-lg px-4 py-2 max-w-xs ${
                          message.isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Input */}
                <div className="border-t p-4">
                  <form onSubmit={handleSubmit} className="flex space-x-2 mb-3">
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Nhập câu hỏi..."
                      className="flex-1"
                    />
                    <Button type="submit" size="icon">
                      <Send size={16} />
                    </Button>
                  </form>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((action) => (
                      <Button
                        key={action}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => sendMessage(action)}
                      >
                        {action}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
