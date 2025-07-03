import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, User, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: number;
  userId: number;
  roomId: number;
  bookingId: number;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

interface ReviewFormProps {
  roomId: number;
  bookingId: number;
  onSubmitSuccess?: () => void;
}

export function ReviewForm({ roomId, bookingId, onSubmitSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      const response = await apiRequest("POST", "/api/reviews", reviewData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Đánh giá thành công!",
        description: "Cảm ơn bạn đã chia sẻ trải nghiệm",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      setRating(0);
      setTitle("");
      setComment("");
      onSubmitSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi đánh giá",
        description: error.message || "Có lỗi xảy ra khi gửi đánh giá",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({
        title: "Vui lòng chọn số sao",
        description: "Bạn cần đánh giá ít nhất 1 sao",
        variant: "destructive",
      });
      return;
    }

    createReviewMutation.mutate({
      roomId,
      bookingId,
      rating,
      title,
      comment,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đánh giá phòng của bạn</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating Stars */}
          <div>
            <Label className="text-sm font-medium">Đánh giá tổng thể</Label>
            <div className="flex items-center space-x-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-8 h-8 cursor-pointer transition-colors ${
                    star <= (hoveredRating || rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                />
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {rating > 0 && `${rating} sao`}
              </span>
            </div>
          </div>

          {/* Review Title */}
          <div>
            <Label htmlFor="title">Tiêu đề đánh giá</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tóm tắt trải nghiệm của bạn..."
              maxLength={255}
            />
          </div>

          {/* Review Comment */}
          <div>
            <Label htmlFor="comment">Chi tiết đánh giá</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ chi tiết về trải nghiệm của bạn..."
              rows={4}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={createReviewMutation.isPending || rating === 0}
          >
            {createReviewMutation.isPending ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface ReviewListProps {
  roomId?: number;
  userId?: number;
  limit?: number;
}

export function ReviewList({ roomId, userId, limit }: ReviewListProps) {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["/api/reviews", { roomId, userId, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roomId) params.append("roomId", roomId.toString());
      if (userId) params.append("userId", userId.toString());
      if (limit) params.append("limit", limit.toString());
      
      const response = await apiRequest("GET", `/api/reviews?${params}`);
      return await response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Chưa có đánh giá nào</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review: Review, index: number) => (
        <motion.div
          key={review.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                    {review.user?.firstName?.[0] || <User size={16} />}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {review.user ? `${review.user.firstName} ${review.user.lastName}` : "Khách hàng"}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar size={14} />
                      <span>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-sm font-medium">{review.rating}/5</span>
                </div>
              </div>
              
              {review.title && (
                <h4 className="font-semibold mb-2">{review.title}</h4>
              )}
              
              {review.comment && (
                <p className="text-muted-foreground">{review.comment}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

interface RoomRatingProps {
  roomId: number;
  showCount?: boolean;
}

export function RoomRating({ roomId, showCount = true }: RoomRatingProps) {
  const { data: ratingData } = useQuery({
    queryKey: ["/api/rooms", roomId, "rating"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/rooms/${roomId}/rating`);
      return await response.json();
    },
  });

  if (!ratingData) {
    return null;
  }

  const { averageRating, totalReviews } = ratingData;

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= Math.round(averageRating)
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
      <span className="font-medium">{averageRating.toFixed(1)}</span>
      {showCount && (
        <span className="text-sm text-muted-foreground">
          ({totalReviews} đánh giá)
        </span>
      )}
    </div>
  );
}