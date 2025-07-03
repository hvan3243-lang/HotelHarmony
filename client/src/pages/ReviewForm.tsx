import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, useParams } from "wouter";
import { authManager } from "@/lib/auth";

interface ReviewFormData {
  rating: number;
  comment: string;
  cleanliness: number;
  service: number;
  amenities: number;
  valueForMoney: number;
  location: number;
  wouldRecommend: boolean;
  guestType: string;
  stayPurpose: string;
}

const StarRating = ({ 
  value, 
  onChange, 
  label 
}: { 
  value: number; 
  onChange: (value: number) => void; 
  label: string;
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-colors"
          >
            <Star
              size={20}
              className={
                star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 hover:text-yellow-400"
              }
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default function ReviewForm() {
  const [, setLocation] = useLocation();
  const { bookingId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check authentication
  useEffect(() => {
    if (!authManager.isAuthenticated()) {
      setLocation("/auth");
    }
  }, [setLocation]);

  // Fetch user bookings to find the specific booking
  const { data: userBookings, isLoading } = useQuery({
    queryKey: ["/api/bookings"],
    enabled: !!bookingId,
  });

  const booking = Array.isArray(userBookings) ? userBookings.find((b: any) => b.id === parseInt(bookingId || "0")) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Không tìm thấy thông tin đặt phòng</h2>
          <Button onClick={() => setLocation("/customer")}>Quay về trang khách hàng</Button>
        </div>
      </div>
    );
  }
  
  const [ratings, setRatings] = useState({
    rating: 5,
    cleanliness: 5,
    service: 5,
    amenities: 5,
    valueForMoney: 5,
    location: 5,
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ReviewFormData>({
    defaultValues: {
      rating: 5,
      cleanliness: 5,
      service: 5,
      amenities: 5,
      valueForMoney: 5,
      location: 5,
      wouldRecommend: true,
      guestType: "leisure",
      stayPurpose: "",
      comment: ""
    }
  });

  const createReviewMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/reviews", data),
    onSuccess: () => {
      toast({
        title: "Đánh giá thành công",
        description: "Cảm ơn bạn đã chia sẻ trải nghiệm tại khách sạn",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      setLocation("/customer");
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi gửi đánh giá",
        description: error.message || "Vui lòng thử lại",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReviewFormData) => {
    createReviewMutation.mutate({
      ...data,
      ...ratings,
      roomId: booking.room.id,
      bookingId: booking.id,
    });
  };

  const updateRating = (key: keyof typeof ratings, value: number) => {
    setRatings(prev => ({ ...prev, [key]: value }));
    setValue(key, value);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
              <CardTitle className="text-2xl font-bold text-center">
                Đánh giá trải nghiệm của bạn
              </CardTitle>
              <div className="text-center text-muted-foreground">
                <p>{booking.room.type} - Phòng {booking.room.number}</p>
                <p className="text-sm">Mã đặt phòng: HLX{booking.id}</p>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Overall Rating */}
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">Đánh giá tổng thể</h3>
                  <div className="flex justify-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => updateRating('rating', star)}
                        className="transition-colors"
                      >
                        <Star
                          size={32}
                          className={
                            star <= ratings.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 hover:text-yellow-400"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detailed Ratings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StarRating
                    value={ratings.cleanliness}
                    onChange={(value) => updateRating('cleanliness', value)}
                    label="Độ sạch sẽ"
                  />
                  <StarRating
                    value={ratings.service}
                    onChange={(value) => updateRating('service', value)}
                    label="Chất lượng dịch vụ"
                  />
                  <StarRating
                    value={ratings.amenities}
                    onChange={(value) => updateRating('amenities', value)}
                    label="Tiện nghi"
                  />
                  <StarRating
                    value={ratings.valueForMoney}
                    onChange={(value) => updateRating('valueForMoney', value)}
                    label="Giá trị tiền bạc"
                  />
                  <StarRating
                    value={ratings.location}
                    onChange={(value) => updateRating('location', value)}
                    label="Vị trí"
                  />
                </div>

                {/* Comment */}
                <div className="space-y-2">
                  <Label htmlFor="comment">Chia sẻ trải nghiệm của bạn</Label>
                  <Textarea
                    id="comment"
                    {...register("comment")}
                    placeholder="Hãy chia sẻ những điều bạn thích và có thể cải thiện..."
                    rows={4}
                  />
                </div>

                {/* Guest Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guestType">Loại khách</Label>
                    <Select onValueChange={(value) => setValue("guestType", value)} defaultValue="leisure">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leisure">Du lịch</SelectItem>
                        <SelectItem value="business">Công tác</SelectItem>
                        <SelectItem value="family">Gia đình</SelectItem>
                        <SelectItem value="couple">Cặp đôi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stayPurpose">Mục đích lưu trú</Label>
                    <Select onValueChange={(value) => setValue("stayPurpose", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn mục đích" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vacation">Nghỉ dưỡng</SelectItem>
                        <SelectItem value="business">Công tác</SelectItem>
                        <SelectItem value="event">Sự kiện</SelectItem>
                        <SelectItem value="transit">Quá cảnh</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Would Recommend */}
                <div className="space-y-2">
                  <Label>Bạn có giới thiệu khách sạn này cho bạn bè không?</Label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        {...register("wouldRecommend")}
                        value="true"
                        defaultChecked
                        className="text-primary"
                      />
                      <span>Có</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        {...register("wouldRecommend")}
                        value="false"
                        className="text-primary"
                      />
                      <span>Không</span>
                    </label>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/customer")}
                  >
                    Quay lại
                  </Button>
                  <Button
                    type="submit"
                    disabled={createReviewMutation.isPending}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  >
                    {createReviewMutation.isPending ? "Đang gửi..." : "Gửi đánh giá"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}