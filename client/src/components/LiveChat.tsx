import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  Crown,
  HeadphonesIcon,
  Maximize2,
  Minimize2,
  Paperclip,
  Send,
  Smile,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Define ChatMessage type locally since it's not exported from shared/schema
interface ChatMessage {
  id: number;
  user_id: number;
  message: string;
  is_from_admin: number;
  is_read: number;
  created_at: string;
}

interface LiveChatProps {
  isAdmin?: boolean;
  selectedUserId?: number;
}

export function LiveChat({ isAdmin = false, selectedUserId }: LiveChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [conversations, setConversations] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = authManager.getUser();

  // Debug log để kiểm tra user
  console.log("LiveChat user debug:", {
    user,
    userRole: user?.role,
    isAdmin,
    selectedUserId,
  });

  const currentUserId = isAdmin && selectedUserId ? selectedUserId : user?.id;

  // Fetch messages for current conversation
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/chat/messages", currentUserId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (isAdmin && selectedUserId) {
        params.append("userId", selectedUserId.toString());
      }
      return fetch(`/api/chat/messages?${params}`, {
        headers: {
          Authorization: `Bearer ${authManager.getToken()}`,
        },
      }).then((res) => res.json());
    },
    enabled: !!currentUserId && isOpen,
    refetchInterval: 500, // Refresh every 0.5 seconds for real-time updates
  });

  // Fetch admin conversations
  const { data: adminConversations = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/chat/conversations"],
    enabled: isAdmin && isOpen,
    refetchInterval: 5000,
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (data: { targetUserId: number }) =>
      apiRequest("PUT", "/api/chat/messages/read", data),
  });

  // Auto mark as read when messages are loaded
  useEffect(() => {
    if (currentUserId && messages && messages.length > 0 && isOpen) {
      // Mark messages from the other party as read
      // If user is admin, mark messages from selected user as read
      // If user is customer, mark messages from admin (ID: 1) as read
      const targetUserId = isAdmin ? selectedUserId || 1 : 1;
      markAsReadMutation.mutate({ targetUserId });
    }
  }, [currentUserId, messages, isOpen, isAdmin, selectedUserId]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => {
      const payload: any = { message };
      if (isAdmin && selectedUserId) {
        payload.targetUserId = selectedUserId;
      }
      return apiRequest("POST", "/api/chat/messages", payload);
    },
    onSuccess: () => {
      setNewMessage("");
      // Force immediate refresh of messages
      queryClient.invalidateQueries({
        queryKey: ["/api/chat/messages", currentUserId],
      });
      queryClient.refetchQueries({
        queryKey: ["/api/chat/messages", currentUserId],
      });
      if (isAdmin) {
        queryClient.invalidateQueries({
          queryKey: ["/api/admin/chat/conversations"],
        });
        queryClient.refetchQueries({
          queryKey: ["/api/admin/chat/conversations"],
        });
      }
      // Scroll to bottom immediately
      setTimeout(scrollToBottom, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi gửi tin nhắn",
        description: error.message || "Không thể gửi tin nhắn",
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (isOpen && !wsRef.current) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      // Always connect to port 5000 for WebSocket (server port)
      const wsUrl = `${protocol}//${window.location.hostname}:5000/ws`;

      try {
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log("WebSocket connected for chat");
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "new_message") {
              // Refresh messages when new message arrives
              queryClient.invalidateQueries({
                queryKey: ["/api/chat/messages", currentUserId],
              });
              if (isAdmin) {
                queryClient.invalidateQueries({
                  queryKey: ["/api/admin/chat/conversations"],
                });
              }
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        wsRef.current.onclose = () => {
          console.log("WebSocket disconnected");
          wsRef.current = null;
        };

        wsRef.current.onerror = (error) => {
          console.error("WebSocket error:", error);
        };
      } catch (error) {
        console.error("Error creating WebSocket connection:", error);
      }
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isOpen, currentUserId, queryClient, isAdmin]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage;

    // Optimistic update - show message immediately
    const optimisticMessage = {
      id: Date.now(), // Temporary ID
      userId: user?.id || 0,
      message: messageText,
      isFromAdmin: isAdmin,
      createdAt: new Date().toISOString(),
      user: {
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
      },
    };

    // Update the cache optimistically
    queryClient.setQueryData(
      ["/api/chat/messages", currentUserId],
      (oldData: any) => {
        return [...(oldData || []), optimisticMessage];
      }
    );

    setNewMessage("");
    setTimeout(scrollToBottom, 50);

    sendMessageMutation.mutate(messageText);
  };

  const unreadCount = messages.filter(
    (msg: ChatMessage) =>
      !msg.is_read && msg.is_from_admin !== (user?.role === "admin")
  ).length;

  if (!user) return null;

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="rounded-full w-16 h-16 shadow-2xl hover:shadow-3xl transition-all duration-300 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 border-0"
          >
            <div className="relative">
              <HeadphonesIcon size={28} className="text-white" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-3 -right-3 h-7 w-7 flex items-center justify-center p-0 text-xs font-bold border-2 border-white shadow-lg"
                >
                  {unreadCount}
                </Badge>
              )}
            </div>
          </Button>
        </motion.div>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)]"
          >
            <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-slate-50/50 backdrop-blur-sm">
              <CardHeader className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-xl border-b border-purple-400/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <HeadphonesIcon size={20} className="text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">
                        {isAdmin ? "Hỗ trợ khách hàng" : "Chat hỗ trợ"}
                      </CardTitle>
                      <p className="text-purple-100 text-sm">
                        {isAdmin
                          ? "Quản lý tin nhắn khách hàng"
                          : "Hỗ trợ trực tuyến 24/7"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="text-white hover:bg-white/20 h-9 w-9 p-0 rounded-lg transition-all duration-200"
                    >
                      {isMinimized ? (
                        <Maximize2 size={16} />
                      ) : (
                        <Minimize2 size={16} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="text-white hover:bg-white/20 h-9 w-9 p-0 rounded-lg transition-all duration-200"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {!isMinimized && (
                <CardContent className="p-0">
                  {/* Admin Conversation List */}
                  {isAdmin && !selectedUserId && (
                    <div className="h-96">
                      <div className="p-4 border-b bg-muted/30">
                        <h3 className="font-medium text-sm text-muted-foreground">
                          Cuộc trò chuyện ({adminConversations.length})
                        </h3>
                      </div>
                      <ScrollArea className="h-80">
                        {adminConversations.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            Chưa có cuộc trò chuyện nào
                          </div>
                        ) : (
                          adminConversations.map((conv: any) => (
                            <div
                              key={conv.userId}
                              className="p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() => {
                                // Set selectedUserId to show chat with this user
                                window.location.href = `/admin?chatUserId=${conv.userId}`;
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    {conv.userName[0]}
                                    {conv.userLastName[0]}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {conv.userName} {conv.userLastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {conv.lastMessage}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatTime(conv.lastMessageTime)}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </ScrollArea>
                    </div>
                  )}

                  {/* Chat Messages */}
                  {(!isAdmin || selectedUserId) && (
                    <>
                      <div className="h-96">
                        <ScrollArea className="h-full p-6 bg-gradient-to-br from-slate-50/30 via-white to-slate-50/30">
                          {isLoading ? (
                            <div className="flex justify-center items-center h-full">
                              <div className="flex flex-col items-center space-y-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse">
                                  <HeadphonesIcon
                                    size={24}
                                    className="text-white"
                                  />
                                </div>
                                <p className="text-slate-600 font-medium">
                                  Đang tải tin nhắn...
                                </p>
                              </div>
                            </div>
                          ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-500 rounded-3xl flex items-center justify-center shadow-lg">
                                <HeadphonesIcon
                                  size={32}
                                  className="text-white"
                                />
                              </div>
                              <div>
                                <h3 className="font-bold text-xl text-slate-800 mb-3">
                                  Chào mừng bạn!
                                </h3>
                                <p className="text-slate-600 leading-relaxed max-w-sm">
                                  Chúng tôi sẵn sàng hỗ trợ bạn 24/7. Hãy gửi
                                  tin nhắn để bắt đầu cuộc trò chuyện.
                                </p>
                              </div>
                              <div className="flex space-x-3">
                                <Badge
                                  variant="outline"
                                  className="bg-purple-50 border-purple-200 text-purple-700"
                                >
                                  🏨 Đặt phòng
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 border-blue-200 text-blue-700"
                                >
                                  💳 Thanh toán
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="bg-purple-50 border-purple-200 text-purple-700"
                                >
                                  🛎️ Dịch vụ
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {messages.map(
                                (message: ChatMessage, index: number) => {
                                  const isFromAdmin = Number(
                                    message.is_from_admin
                                  );
                                  // Logic: Tin nhắn của mình (người gửi) hiển thị bên phải
                                  // Tin nhắn của người khác (người nhận) hiển thị bên trái
                                  // Nếu tôi là admin: tin nhắn admin = của tôi (phải), tin nhắn customer = của người khác (trái)
                                  // Nếu tôi là customer: tin nhắn customer = của tôi (phải), tin nhắn admin = của người khác (trái)
                                  const isMyMessage =
                                    (isFromAdmin === 1 &&
                                      user?.role === "admin") ||
                                    (isFromAdmin === 0 &&
                                      user?.role === "customer");
                                  const isRight = isMyMessage;

                                  // Debug log
                                  console.log("Message debug:", {
                                    messageId: message.id,
                                    isFromAdmin,
                                    userRole: user?.role,
                                    isMyMessage,
                                    isRight,
                                    message: message.message,
                                  });

                                  const showDate =
                                    index === 0 ||
                                    new Date(
                                      message.created_at
                                    ).toDateString() !==
                                      new Date(
                                        messages[index - 1].created_at
                                      ).toDateString();

                                  const formatDate = (dateString: string) => {
                                    try {
                                      const date = new Date(dateString);
                                      if (isNaN(date.getTime()))
                                        return "Invalid Date";
                                      return date.toLocaleDateString("vi-VN", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      });
                                    } catch (error) {
                                      return "Invalid Date";
                                    }
                                  };

                                  const formatTime = (dateString: string) => {
                                    try {
                                      const date = new Date(dateString);
                                      if (isNaN(date.getTime()))
                                        return "Invalid Time";
                                      return date.toLocaleTimeString("vi-VN", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      });
                                    } catch (error) {
                                      return "Invalid Time";
                                    }
                                  };
                                  return (
                                    <div key={message.id}>
                                      {showDate && (
                                        <div className="text-center my-4">
                                          <Separator />
                                          <span className="bg-background px-2 text-xs text-muted-foreground">
                                            {formatDate(message.created_at)}
                                          </span>
                                        </div>
                                      )}
                                      <div
                                        className={`flex ${
                                          isRight
                                            ? "justify-end"
                                            : "justify-start"
                                        }`}
                                      >
                                        <div
                                          className={`max-w-[85%] ${
                                            isRight ? "order-2" : "order-1"
                                          }`}
                                        >
                                          <div
                                            className={`flex items-end space-x-3 ${
                                              isRight
                                                ? "flex-row-reverse space-x-reverse"
                                                : ""
                                            }`}
                                          >
                                            <div
                                              className={`w-8 h-8 rounded-2xl flex items-center justify-center text-xs font-bold shadow-lg ${
                                                isRight
                                                  ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                                                  : "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700"
                                              }`}
                                            >
                                              {isRight ? (
                                                <Crown size={14} />
                                              ) : (
                                                <User size={14} />
                                              )}
                                            </div>
                                            <div
                                              className={`rounded-2xl p-4 max-w-full shadow-sm hover:shadow-md transition-all duration-200 ${
                                                isRight
                                                  ? "bg-gradient-to-br from-purple-500 to-purple-600 text-white"
                                                  : "bg-white border border-slate-200/60"
                                              }`}
                                            >
                                              <div className="flex items-center justify-between mb-2">
                                                <span
                                                  className={`text-xs font-semibold ${
                                                    isRight
                                                      ? "text-purple-100"
                                                      : "text-slate-600"
                                                  }`}
                                                >
                                                  {isFromAdmin
                                                    ? "Admin"
                                                    : "Bạn"}
                                                </span>
                                                <span
                                                  className={`text-xs ${
                                                    isRight
                                                      ? "text-purple-100/80"
                                                      : "text-slate-500"
                                                  }`}
                                                >
                                                  {formatTime(
                                                    message.created_at
                                                  )}
                                                </span>
                                              </div>
                                              <p
                                                className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${
                                                  isRight
                                                    ? "text-white"
                                                    : "text-slate-800"
                                                }`}
                                              >
                                                {message.message}
                                              </p>
                                              {/* Message status for my messages */}
                                              {isRight && (
                                                <div className="flex items-center justify-end mt-2">
                                                  <span className="flex items-center space-x-1">
                                                    {message.is_read ? (
                                                      <span className="text-xs text-purple-200 flex items-center">
                                                        <CheckCircle
                                                          size={12}
                                                          className="mr-1"
                                                        />
                                                        Đã đọc
                                                      </span>
                                                    ) : (
                                                      <span className="text-xs text-purple-200 flex items-center">
                                                        <Clock
                                                          size={12}
                                                          className="mr-1"
                                                        />
                                                        Đã gửi
                                                      </span>
                                                    )}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                              <div ref={messagesEndRef} />
                            </div>
                          )}
                        </ScrollArea>
                      </div>

                      {/* Message Input */}
                      <div className="p-6 border-t border-slate-200/60 bg-white/95 backdrop-blur-sm">
                        <form
                          onSubmit={handleSendMessage}
                          className="flex items-end gap-3"
                        >
                          <div className="flex-1 relative">
                            <Input
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Nhập tin nhắn hỗ trợ..."
                              disabled={sendMessageMutation.isPending}
                              className="min-h-[48px] border-slate-200/60 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 rounded-2xl bg-white/80 backdrop-blur-sm text-base font-medium shadow-sm"
                            />
                            <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 transition-all duration-200"
                              >
                                <Smile size={16} className="text-slate-500" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 transition-all duration-200"
                              >
                                <Paperclip
                                  size={16}
                                  className="text-slate-500"
                                />
                              </Button>
                            </div>
                          </div>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={
                              !newMessage.trim() ||
                              sendMessageMutation.isPending
                            }
                            className="h-12 w-12 p-0 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                          >
                            <Send size={18} className="text-white" />
                          </Button>
                        </form>
                      </div>
                    </>
                  )}
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
