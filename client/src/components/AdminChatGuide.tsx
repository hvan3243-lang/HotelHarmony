import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ArrowRight, Users, Send } from "lucide-react";
import { motion } from "framer-motion";

export function AdminChatGuide() {
  const steps = [
    {
      step: 1,
      title: "Mở chat",
      description: "Nhấn biểu tượng chat ở góc dưới màn hình",
      icon: <MessageCircle className="w-5 h-5" />,
      color: "bg-blue-500"
    },
    {
      step: 2,
      title: "Chọn khách hàng",
      description: "Click vào tên khách hàng trong danh sách để xem tin nhắn",
      icon: <Users className="w-5 h-5" />,
      color: "bg-green-500"
    },
    {
      step: 3,
      title: "Trả lời tin nhắn",
      description: "Gõ tin nhắn trong ô input và nhấn gửi",
      icon: <Send className="w-5 h-5" />,
      color: "bg-purple-500"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-900 dark:text-blue-100">
            <MessageCircle className="w-6 h-6" />
            <span>Hướng dẫn trả lời tin nhắn khách hàng</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3"
              >
                <div className={`${step.color} rounded-full p-2 text-white flex-shrink-0`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      Bước {step.step}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                    {step.title}
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-blue-400 mt-3 hidden md:block" />
                )}
              </motion.div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              💡 <strong>Lưu ý:</strong> Khi bạn click vào tên khách hàng, URL sẽ chuyển thành <code>/admin?chatUserId=X</code> và chat sẽ hiển thị tin nhắn của khách hàng đó.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}