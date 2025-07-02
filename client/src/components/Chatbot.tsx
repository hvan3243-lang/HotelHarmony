import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Xin chào! Tôi là AI Assistant của HotelLux. Tôi có thể giúp bạn tìm phòng phù hợp, giải đáp về giá và tiện nghi, hoặc hướng dẫn đặt phòng. Bạn cần hỗ trợ gì?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const quickActions = [
    "Giá phòng",
    "Tiện nghi",
    "Đặt phòng",
    "Chính sách hủy"
  ];

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");

    // Simulate AI response
    setTimeout(() => {
      const responses: Record<string, string> = {
        "giá phòng": "Giá phòng của chúng tôi: Standard (800.000đ), Deluxe (1.500.000đ), Suite (2.800.000đ), Presidential (8.500.000đ). Tất cả đã bao gồm ăn sáng!",
        "tiện nghi": "Tiện nghi bao gồm: WiFi miễn phí, TV 4K, điều hòa, minibar, két an toàn, và dịch vụ phòng 24/7. Phòng cao cấp có thêm balcony và jacuzzi.",
        "đặt phòng": "Để đặt phòng, bạn có thể sử dụng form tìm kiếm trên trang chủ hoặc tôi có thể chuyển bạn đến trang đặt phòng ngay bây giờ!",
        "chính sách hủy": "Bạn có thể hủy miễn phí trước 24h. Hủy trong vòng 24h sẽ tính phí 50% tổng tiền đặt phòng.",
      };

      const lowerText = text.toLowerCase();
      let response = "Cảm ơn bạn đã liên hệ! Tôi đang xử lý yêu cầu của bạn. Bạn có thể hỏi về giá phòng, tiện nghi, hoặc cách đặt phòng.";

      for (const [key, value] of Object.entries(responses)) {
        if (lowerText.includes(key)) {
          response = value;
          break;
        }
      }

      const aiMessage: Message = {
        id: Date.now() + 1,
        text: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
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
            className="absolute bottom-20 right-0 w-80 max-w-[calc(100vw-2rem)]"
          >
            <Card className="shadow-2xl border-2">
              <CardHeader className="bg-primary text-primary-foreground p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                      <Bot size={16} />
                    </div>
                    <div>
                      <CardTitle className="text-sm">AI Assistant</CardTitle>
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
