import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Filter, 
  Star, 
  Wifi, 
  Car, 
  Coffee, 
  Tv, 
  Bath, 
  Bed,
  Users,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { authManager } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Room } from "@shared/schema";

export default function Booking() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState({
    checkIn: "",
    checkOut: "",
    guests: "2",
    roomType: "all"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const roomsPerPage = 6;

  // Load saved room data from localStorage if coming from customer page
  useEffect(() => {
    const savedRoomData = localStorage.getItem('selectedRoomData');
    if (savedRoomData) {
      const roomData = JSON.parse(savedRoomData);
      setSelectedRoom(roomData);
      localStorage.removeItem('selectedRoomData'); // Clear after use
    }
  }, []);

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["/api/rooms"],
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ["/api/recommendations"],
    enabled: !!authManager.getUser(),
  });

  const filteredRooms = (rooms as Room[]).filter((room) => {
    const matchesType = searchParams.roomType === "all" || room.type === searchParams.roomType;
    const matchesGuests = parseInt(searchParams.guests) <= room.capacity;
    return matchesType && matchesGuests && room.status === "available";
  });

  const totalPages = Math.ceil(filteredRooms.length / roomsPerPage);
  const startIndex = (currentPage - 1) * roomsPerPage;
  const paginatedRooms = filteredRooms.slice(startIndex, startIndex + roomsPerPage);

  const calculateTotalPrice = (room: Room) => {
    if (!searchParams.checkIn || !searchParams.checkOut) return 0;
    const checkIn = new Date(searchParams.checkIn);
    const checkOut = new Date(searchParams.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return nights * parseFloat(room.price.replace(/[.,]/g, ''));
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

    if (!searchParams.checkIn || !searchParams.checkOut) {
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
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        guests: parseInt(searchParams.guests),
        totalPrice: calculateTotalPrice(room).toString(),
        specialRequests: ""
      };

      // Create booking in database first
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authManager.getToken()}`
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Không thể tạo đặt phòng');
      }

      const booking = await response.json();
      
      // Save booking info to localStorage for payment
      localStorage.setItem('currentBooking', JSON.stringify(booking));
      localStorage.setItem('selectedRoomInfo', JSON.stringify(room));
      
      toast({
        title: "Tạo đặt phòng thành công",
        description: "Chuyển đến trang thanh toán...",
      });
      
      setLocation('/payment');
    } catch (error: any) {
      toast({
        title: "Lỗi tạo đặt phòng",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoomTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      standard: "Standard",
      deluxe: "Deluxe", 
      suite: "Suite",
      presidential: "Presidential",
    };
    return labels[type] || type;
  };

  const getAmenityIcon = (amenity: string) => {
    const iconMap: Record<string, any> = {
      "wifi": Wifi,
      "tv": Tv,
      "parking": Car,
      "coffee": Coffee,
      "bath": Bath,
      "bed": Bed,
    };
    
    for (const [key, Icon] of Object.entries(iconMap)) {
      if (amenity.toLowerCase().includes(key)) {
        return Icon;
      }
    }
    return Star;
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-4">Đặt phòng khách sạn</h1>
          <p className="text-muted-foreground text-lg">Tìm và đặt phòng phù hợp với nhu cầu của bạn</p>
        </motion.div>

        {/* Search Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="card-enhanced glass backdrop-blur-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="checkin">Ngày nhận phòng</Label>
                  <Input
                    id="checkin"
                    type="date"
                    value={searchParams.checkIn}
                    onChange={(e) => setSearchParams({...searchParams, checkIn: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="checkout">Ngày trả phòng</Label>
                  <Input
                    id="checkout"
                    type="date"
                    value={searchParams.checkOut}
                    onChange={(e) => setSearchParams({...searchParams, checkOut: e.target.value})}
                    min={searchParams.checkIn || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="guests">Số khách</Label>
                  <Select value={searchParams.guests} onValueChange={(value) => setSearchParams({...searchParams, guests: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 khách</SelectItem>
                      <SelectItem value="2">2 khách</SelectItem>
                      <SelectItem value="3">3 khách</SelectItem>
                      <SelectItem value="4">4 khách</SelectItem>
                      <SelectItem value="5">5+ khách</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="roomtype">Loại phòng</Label>
                  <Select value={searchParams.roomType} onValueChange={(value) => setSearchParams({...searchParams, roomType: value})}>
                    <SelectTrigger>
                      <SelectValue />
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
                <div className="flex items-end">
                  <Button className="w-full btn-primary hover-glow">
                    <Search className="mr-2" size={16} />
                    Tìm kiếm
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800 dark:text-blue-200">
                  <Star className="mr-2 text-yellow-500" fill="currentColor" />
                  Đề xuất dành cho bạn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recommendations.slice(0, 3).map((room: Room) => (
                    <div key={room.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                      <h4 className="font-semibold">Phòng {room.number}</h4>
                      <p className="text-sm text-muted-foreground">{getRoomTypeLabel(room.type)}</p>
                      <p className="text-lg font-bold text-primary">{room.price}đ/đêm</p>
                      <Button 
                        size="sm" 
                        className="mt-2 w-full"
                        onClick={() => handleBookRoom(room)}
                      >
                        Đặt ngay
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">
            Tìm thấy <span className="font-semibold">{filteredRooms.length}</span> phòng phù hợp
          </p>
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sắp xếp theo giá</span>
          </div>
        </div>

        {/* Room Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded mb-4 w-2/3"></div>
                  <div className="h-6 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedRooms.map((room: Room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card className="card-enhanced hover-grow overflow-hidden h-full">
                  {/* Room Image Placeholder */}
                  <div className={`relative h-48 gradient-bg-${(index % 5) + 1} flex items-center justify-center`}>
                    <div className="text-white text-center animate-float">
                      <Bed className="mx-auto mb-2" size={32} />
                      <span className="text-lg font-semibold">Phòng {room.number}</span>
                    </div>
                    <Badge className="absolute top-3 right-3 glass backdrop-blur-lg text-white">
                      {getRoomTypeLabel(room.type)}
                    </Badge>
                  </div>

                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">
                        Phòng {room.number}
                      </h3>
                      
                      <div className="flex items-center text-sm text-muted-foreground mb-3">
                        <Users className="mr-1" size={14} />
                        <span>Tối đa {room.capacity} khách</span>
                      </div>

                      {room.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {room.description}
                        </p>
                      )}

                      {/* Amenities */}
                      {room.amenities && room.amenities.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {room.amenities.slice(0, 4).map((amenity, i) => {
                              const Icon = getAmenityIcon(amenity);
                              return (
                                <div key={i} className="flex items-center bg-muted/50 rounded-full px-2 py-1">
                                  <Icon size={12} className="mr-1 text-muted-foreground" />
                                  <span className="text-xs">{amenity}</span>
                                </div>
                              );
                            })}
                          </div>
                          {room.amenities.length > 4 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              +{room.amenities.length - 4} tiện ích khác
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Pricing and Booking */}
                    <Separator className="my-4" />
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-2xl font-bold text-primary">
                            {parseInt(room.price).toLocaleString()}đ
                          </span>
                          <span className="text-sm text-muted-foreground">/đêm</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="text-yellow-500 mr-1" size={16} fill="currentColor" />
                          <span className="text-sm font-medium">4.8</span>
                        </div>
                      </div>

                      {searchParams.checkIn && searchParams.checkOut && (
                        <div className="text-sm">
                          <div className="flex justify-between">
                            <span>Tổng tiền:</span>
                            <span className="font-semibold">
                              {calculateTotalPrice(room).toLocaleString()}đ
                            </span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>
                              {Math.ceil((new Date(searchParams.checkOut).getTime() - new Date(searchParams.checkIn).getTime()) / (1000 * 60 * 60 * 24))} đêm
                            </span>
                            <span>{searchParams.guests} khách</span>
                          </div>
                        </div>
                      )}

                      <Button 
                        className="w-full btn-secondary hover-glow group-hover:shadow-md transition-all"
                        onClick={() => handleBookRoom(room)}
                      >
                        <Calendar className="mr-2" size={16} />
                        Đặt phòng ngay
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredRooms.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-muted-foreground" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Không tìm thấy phòng phù hợp</h3>
              <p className="text-muted-foreground mb-4">
                Thử thay đổi tiêu chí tìm kiếm hoặc ngày để xem thêm lựa chọn
              </p>
              <Button variant="outline" onClick={() => {
                setSearchParams({
                  checkIn: "",
                  checkOut: "",
                  guests: "2",
                  roomType: "all"
                });
                setCurrentPage(1);
              }}>
                Đặt lại bộ lọc
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}