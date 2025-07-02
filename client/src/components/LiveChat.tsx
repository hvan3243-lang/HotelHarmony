import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Send, X, Minimize2, Maximize2, User, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@shared/schema";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = authManager.getUser();

  const currentUserId = isAdmin && selectedUserId ? selectedUserId : user?.id;

  // Fetch messages for current conversation
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/chat/messages", currentUserId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (isAdmin && selectedUserId) {
        params.append('userId', selectedUserId.toString());
      }
      return fetch(`/api/chat/messages?${params}`, {
        headers: {
          'Authorization': `Bearer ${authManager.getToken()}`
        }
      }).then(res => res.json());
    },
    enabled: !!currentUserId && isOpen,
    refetchInterval: 2000, // Refresh every 2 seconds for real-time updates
  });

  // Fetch admin conversations
  const { data: adminConversations = [] } = useQuery({
    queryKey: ["/api/admin/chat/conversations"],
    enabled: isAdmin && isOpen,
    refetchInterval: 5000,
  });

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
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      if (isAdmin) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/chat/conversations"] });
      }
      scrollToBottom();
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

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage);
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const unreadCount = messages.filter((msg: ChatMessage) => 
    !msg.isRead && msg.isFromAdmin !== (user?.role === 'admin')
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
            className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
          >
            <MessageCircle size={24} />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount}
              </Badge>
            )}
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
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]"
          >
            <Card className="shadow-2xl border-2">
              <CardHeader className="p-4 bg-primary text-primary-foreground rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle size={20} />
                    <CardTitle className="text-lg">
                      {isAdmin ? "Hỗ trợ khách hàng" : "Chat hỗ trợ"}
                    </CardTitle>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMinimized(!isMinimized)}
                      className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 p-0"
                    >
                      {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 p-0"
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
                                    {conv.userName[0]}{conv.userLastName[0]}
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
                      <div className="h-80">
                        <ScrollArea className="h-full p-4">
                          {isLoading ? (
                            <div className="flex justify-center items-center h-full">
                              <div className="text-muted-foreground">Đang tải...</div>
                            </div>
                          ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                              <MessageCircle size={48} className="text-muted-foreground mb-4" />
                              <h3 className="font-medium mb-2">Chào mừng bạn!</h3>
                              <p className="text-sm text-muted-foreground">
                                Hãy gửi tin nhắn để bắt đầu cuộc trò chuyện
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {messages.map((message: ChatMessage, index: number) => {
                                const isFromCurrentUser = isAdmin 
                                  ? message.isFromAdmin 
                                  : !message.isFromAdmin;
                                
                                const showDate = index === 0 || 
                                  formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt);

                                return (
                                  <div key={message.id}>
                                    {showDate && (
                                      <div className="text-center my-4">
                                        <Separator />
                                        <span className="bg-background px-2 text-xs text-muted-foreground">
                                          {formatDate(message.createdAt)}
                                        </span>
                                      </div>
                                    )}
                                    
                                    <div className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`max-w-[80%] ${isFromCurrentUser ? 'order-2' : 'order-1'}`}>
                                        <div className={`flex items-end space-x-2 ${isFromCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                            message.isFromAdmin 
                                              ? 'bg-primary text-primary-foreground' 
                                              : 'bg-muted text-muted-foreground'
                                          }`}>
                                            {message.isFromAdmin ? <Crown size={12} /> : <User size={12} />}
                                          </div>
                                          <div className={`rounded-lg p-3 max-w-full ${
                                            isFromCurrentUser
                                              ? 'bg-primary text-primary-foreground'
                                              : 'bg-muted'
                                          }`}>
                                            <p className={`text-xs font-medium mb-1 ${
                                              isFromCurrentUser 
                                                ? 'text-primary-foreground/80' 
                                                : 'text-muted-foreground/80'
                                            }`}>
                                              {(message as any).senderName || (message.isFromAdmin ? 'Admin' : 'Khách hàng')}
                                            </p>
                                            <p className="text-sm whitespace-pre-wrap break-words">
                                              {message.message}
                                            </p>
                                            <p className={`text-xs mt-1 ${
                                              isFromCurrentUser 
                                                ? 'text-primary-foreground/70' 
                                                : 'text-muted-foreground'
                                            }`}>
                                              {formatTime(message.createdAt)}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              <div ref={messagesEndRef} />
                            </div>
                          )}
                        </ScrollArea>
                      </div>

                      {/* Message Input */}
                      <div className="p-4 border-t bg-muted/30">
                        <form onSubmit={handleSendMessage} className="flex space-x-2">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Nhập tin nhắn..."
                            disabled={sendMessageMutation.isPending}
                            className="flex-1"
                          />
                          <Button 
                            type="submit" 
                            size="sm"
                            disabled={!newMessage.trim() || sendMessageMutation.isPending}
                          >
                            <Send size={16} />
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