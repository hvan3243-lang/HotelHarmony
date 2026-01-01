import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bell, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Notification {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  read: boolean;
}

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Kết nối WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Always connect to port 5000 for WebSocket (server port)
    const wsUrl = `${protocol}//${window.location.hostname}:5000/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("Connected to WebSocket");
      // Đăng ký là admin
      socket.send(JSON.stringify({ type: "admin_connect" }));
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "new_booking") {
          const newNotification: Notification = {
            id: Date.now().toString(),
            type: message.type,
            data: message.data,
            timestamp: message.data.timestamp,
            read: false,
          };

          setNotifications((prev) => [newNotification, ...prev]);

          // Hiển thị toast notification
          toast({
            title: "Đặt phòng mới!",
            description: `${message.data.customerName} đã đặt ${message.data.room}`,
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      socket.close();
    };
  }, [toast]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("vi-VN");
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {showNotifications && (
        <Card className="absolute right-0 top-12 w-80 max-h-96 overflow-hidden shadow-lg z-50">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Thông báo</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Đánh dấu đã đọc
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(false)}
                >
                  <X size={16} />
                </Button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Chưa có thông báo mới
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                      !notification.read ? "bg-blue-50 dark:bg-blue-950" : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {notification.type === "new_booking" && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-green-600">
                            Đặt phòng mới
                          </span>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm">
                          <strong>{notification.data.customerName}</strong> đã
                          đặt {notification.data.room}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Check-in:{" "}
                          {new Date(
                            notification.data.checkIn
                          ).toLocaleDateString("vi-VN")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tổng tiền:{" "}
                          {new Intl.NumberFormat("vi-VN").format(
                            notification.data.totalPrice
                          )}
                          đ
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
