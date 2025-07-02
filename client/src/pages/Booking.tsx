import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar, Filter, Bed, Wifi, Car, Eye, Check, Users, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { Room } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { authManager } from "@/lib/auth";

export default function Booking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [priceFilter, setPriceFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [amenityFilter, setAmenityFilter] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookingForm, setBookingForm] = useState({
    specialRequests: "",
  });

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["/api/rooms", checkIn, checkOut],
    enabled: !!checkIn && !!checkOut,
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ["/api/recommendations"],
    enabled: authManager.isAuthenticated(),
  });

  const filteredRooms = rooms.filter((room: Room) => {
    if (priceFilter && priceFilter !== "all") {
      const price = parseFloat(room.price);
      switch (priceFilter) {
        case "low":
          if (price >= 1000000) return false;
          break;
        case "medium":
          if (price < 1000000 || price > 2000000) return false;
          break;
        case "high":
          if (price <= 2000000) return false;
          break;
      }
    }

    if (roomTypeFilter && roomTypeFilter !== "all" && room.type !== roomTypeFilter) return false;

    if (amenityFilter) {
      const hasAmenity = room.amenities.some(amenity =>
        amenity.toLowerCase().includes(amenityFilter.toLowerCase())
      );
      if (!hasAmenity) return false;
    }

    return true;
  });

  const getRoomTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      standard: "Standard",
      deluxe: "Deluxe",
      suite: "Suite",
      presidential: "Presidential",
    };
    return labels[type] || type;
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('vi-VN').format(parseFloat(price)) + "đ";
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateTotalPrice = (room: Room) => {
    const nights = calculateNights();
    const basePrice = parseFloat(room.price) * nights;
    const tax = basePrice * 0.1;
    return basePrice + tax;
  };

  const handleBookRoom = async (room: Room) => {
    if (!authManager.isAuthenticated()) {
      toast({
        title: "Yêu cầu đăng nhập",
        description: "Vui lòng đăng nhập để đặt phòng",
        variant: "destructive",
      });
      setLocation("/auth");
      return;
    }

    if (!checkIn || !checkOut) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng chọn ngày nhận và trả phòng",
        variant: "destructive",
      });
      return;
    }

    try {
      const bookingData = {
        roomId: room.id,
        checkIn: checkIn,
        checkOut: checkOut,
        guests: parseInt(guests),
        totalPrice: calculateTotalPrice(room).toString(),
        specialRequests: bookingForm.specialRequests || "",
      };

      const response = await apiRequest("POST", "/api/bookings", bookingData);
      const booking = await response.json();

      toast({
        title: "Đặt phòng thành công",
        description: "Chúng tôi đã gửi email xác nhận cho bạn",
      });

      // Redirect to checkout
      setLocation(`/checkout/${booking.id}`);
    } catch (error: any) {
      toast({
        title: "Lỗi đặt phòng",
        description: error.message || "Có lỗi xảy ra khi đặt phòng",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <Calendar className="inline mr-3 text-primary" />
            Đặt Phòng
          </h1>
          <p className="text-xl text-muted-foreground">
            Chọn phòng phù hợp với nhu cầu của bạn
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div>
                <Label>Ngày nhận</Label>
                <Input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>
              <div>
                <Label>Ngày trả</Label>
                <Input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>
              <div>
                <Label>Số khách</Label>
                <Select value={guests} onValueChange={setGuests}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Khách</SelectItem>
                    <SelectItem value="2">2 Khách</SelectItem>
                    <SelectItem value="3">3 Khách</SelectItem>
                    <SelectItem value="4">4 Khách</SelectItem>
                    <SelectItem value="5">5+ Khách</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Loại phòng</Label>
                <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="deluxe">Deluxe</SelectItem>
                    <SelectItem value="suite">Suite</SelectItem>
                    <SelectItem value="presidential">Presidential</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lọc theo giá</Label>
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="low">Dưới 1.000.000đ</SelectItem>
                    <SelectItem value="medium">1.000.000đ - 2.000.000đ</SelectItem>
                    <SelectItem value="high">Trên 2.000.000đ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label>Tiện nghi</Label>
                <Input
                  placeholder="Tìm theo tiện nghi (VD: view biển, jacuzzi...)"
                  value={amenityFilter}
                  onChange={(e) => setAmenityFilter(e.target.value)}
                />
              </div>
              <Button className="mt-6">
                <Filter className="mr-2" size={16} />
                Lọc
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">
                🤖 Gợi ý từ AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Dựa trên sở thích của bạn, chúng tôi khuyến nghị những phòng sau:
              </p>
              <div className="flex flex-wrap gap-2">
                {recommendations.slice(0, 3).map((room: Room) => (
                  <Badge key={room.id} variant="outline" className="cursor-pointer"
                    onClick={() => setSelectedRoom(room)}>
                    {getRoomTypeLabel(room.type)} - {formatPrice(room.price)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Room Listings */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-4"></div>
                  <div className="h-3 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded mb-2"></div>
                  <div className="h-8 bg-muted rounded mt-4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Bed className="mx-auto mb-4 text-muted-foreground" size={48} />
              <h3 className="text-lg font-semibold mb-2">Không tìm thấy phòng</h3>
              <p className="text-muted-foreground">
                {checkIn && checkOut 
                  ? "Không có phòng trống trong thời gian này. Vui lòng thử ngày khác."
                  : "Vui lòng chọn ngày để xem phòng có sẵn."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredRooms.map((room: Room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="hover-lift cursor-pointer h-full">
                  <div className="relative">
                    <img
                      src={room.images[0] || "https://images.unsplash.com/photo-1618773928121-c32242e63f39"}
                      alt={`${getRoomTypeLabel(room.type)}`}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <Badge 
                      className={`absolute top-4 right-4 ${
                        room.status === 'available' 
                          ? 'bg-green-500' 
                          : room.status === 'booked' 
                          ? 'bg-red-500' 
                          : 'bg-yellow-500'
                      }`}
                    >
                      {room.status === 'available' ? 'Còn trống' :
                       room.status === 'booked' ? 'Đã đặt' : 'Bảo trì'}
                    </Badge>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {getRoomTypeLabel(room.type)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Phòng số {room.number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {formatPrice(room.price)}
                        </p>
                        <p className="text-sm text-muted-foreground">/đêm</p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="w-4 h-4 mr-2" />
                        <span>Tối đa {room.capacity} khách</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Bed className="w-4 h-4 mr-2" />
                        <span>{room.description}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {room.amenities.slice(0, 3).map((amenity, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                      {room.amenities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{room.amenities.length - 3} khác
                        </Badge>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" onClick={() => setSelectedRoom(room)}>
                            <Eye className="mr-2" size={16} />
                            Chi tiết
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>
                              {getRoomTypeLabel(room.type)} - Phòng {room.number}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <img
                                src={room.images[0] || "https://images.unsplash.com/photo-1618773928121-c32242e63f39"}
                                alt={getRoomTypeLabel(room.type)}
                                className="w-full h-64 object-cover rounded-lg"
                              />
                              <div className="mt-4">
                                <h4 className="font-semibold mb-2">Tiện nghi</h4>
                                <div className="flex flex-wrap gap-2">
                                  {room.amenities.map((amenity, i) => (
                                    <Badge key={i} variant="secondary">
                                      {amenity}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold">Mô tả</h4>
                                  <p className="text-muted-foreground">{room.description}</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold">Sức chứa</h4>
                                  <p className="text-muted-foreground">Tối đa {room.capacity} khách</p>
                                </div>
                                <div>
                                  <h4 className="font-semibold">Giá</h4>
                                  <p className="text-2xl font-bold text-primary">
                                    {formatPrice(room.price)}/đêm
                                  </p>
                                </div>
                                {checkIn && checkOut && (
                                  <div className="p-4 bg-muted rounded-lg">
                                    <h4 className="font-semibold mb-2">Chi tiết giá</h4>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex justify-between">
                                        <span>{formatPrice(room.price)} x {calculateNights()} đêm</span>
                                        <span>{formatPrice((parseFloat(room.price) * calculateNights()).toString())}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Thuế & phí dịch vụ</span>
                                        <span>{formatPrice((parseFloat(room.price) * calculateNights() * 0.1).toString())}</span>
                                      </div>
                                      <Separator />
                                      <div className="flex justify-between font-semibold">
                                        <span>Tổng cộng</span>
                                        <span className="text-primary">
                                          {formatPrice(calculateTotalPrice(room).toString())}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        onClick={() => handleBookRoom(room)}
                        disabled={room.status !== 'available' || !checkIn || !checkOut}
                      >
                        <Check className="mr-2" size={16} />
                        Chọn phòng
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
