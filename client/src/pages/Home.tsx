import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Bed, Utensils, Waves, Calendar as CalendarIcon } from "lucide-react";
import { motion } from "framer-motion";

const heroImages = [
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
];

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [roomType, setRoomType] = useState("");

  const { data: recommendations } = useQuery({
    queryKey: ["/api/recommendations"],
    enabled: false, // Only fetch when user is logged in
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const amenities = [
    {
      icon: Waves,
      title: "Hồ Bơi Infinity",
      description: "Thư giãn tại hồ bơi vô cực với tầm nhìn panoramic tuyệt đẹp",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&h=600",
    },
    {
      icon: Utensils,
      title: "Nhà Hàng 5 Sao",
      description: "Ẩm thực đa dạng từ bếp trưởng Michelin với không gian sang trọng",
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&h=600",
    },
    {
      icon: Bed,
      title: "Spa Thư Giãn",
      description: "Liệu trình chăm sóc toàn diện với thiết bị hiện đại nhất",
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&h=600",
    },
  ];

  const offers = [
    {
      title: "Combo Nghỉ Dưỡng",
      description: "3 ngày 2 đêm + Spa + Ăn sáng + Đưa đón sân bay",
      originalPrice: "4.500.000đ",
      discountPrice: "3.150.000đ",
      discount: "-30%",
      gradient: "from-amber-400 to-orange-500",
    },
    {
      title: "Ưu Đãi Cuối Tuần",
      description: "Đặt phòng cuối tuần + Tặng bữa tối lãng mạn",
      originalPrice: "2.000.000đ",
      discountPrice: "1.500.000đ",
      discount: "-25%",
      gradient: "from-emerald-400 to-teal-500",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        <div className="absolute inset-0">
          <motion.img
            key={currentImageIndex}
            src={heroImages[currentImageIndex]}
            alt="Luxury hotel resort"
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        <div className="relative z-10 h-full flex items-center justify-center text-center">
          <div className="max-w-4xl mx-auto px-6">
            <motion.h1
              className="text-5xl md:text-7xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Trải Nghiệm Luxury
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-white mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Khám phá không gian nghỉ dưỡng đẳng cấp với dịch vụ hoàn hảo
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Link href="/booking">
                <Button size="lg" className="text-lg px-8 py-4 rounded-full">
                  <CalendarIcon className="mr-2" size={20} />
                  Đặt phòng ngay
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-opacity ${
                index === currentImageIndex ? "bg-white opacity-100" : "bg-white opacity-50"
              }`}
              onClick={() => setCurrentImageIndex(index)}
            />
          ))}
        </div>
      </section>

      {/* Smart Room Search Form */}
      <section className="relative z-20 -mt-20 mb-16">
        <div className="max-w-6xl mx-auto px-4">
          <Card className="shadow-2xl">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-center mb-6">
                <Calendar className="inline mr-2 text-primary" />
                Tìm Phòng Thông Minh
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium mb-2">Ngày nhận - Ngày trả</label>
                  <div className="flex space-x-2">
                    <Input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      placeholder="Check-in"
                    />
                    <Input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      placeholder="Check-out"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Số khách</label>
                  <Select value={guests} onValueChange={setGuests}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Khách</SelectItem>
                      <SelectItem value="2">2 Khách</SelectItem>
                      <SelectItem value="3">3-4 Khách</SelectItem>
                      <SelectItem value="4">5+ Khách</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Loại phòng</label>
                  <Select value={roomType} onValueChange={setRoomType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại phòng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Phòng đơn</SelectItem>
                      <SelectItem value="deluxe">Phòng đôi</SelectItem>
                      <SelectItem value="suite">Suite</SelectItem>
                      <SelectItem value="presidential">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Link href="/booking" className="w-full">
                    <Button className="w-full">
                      <Calendar className="mr-2" size={16} />
                      Tìm kiếm
                    </Button>
                  </Link>
                </div>
              </div>

              {/* AI Suggestion */}
              {recommendations && recommendations.length > 0 && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Gợi ý AI:</strong> Dựa trên sở thích của bạn, chúng tôi khuyến nghị {recommendations[0]?.type} 
                    với {recommendations[0]?.amenities?.join(", ")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Featured Amenities */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Tiện Nghi Đẳng Cấp</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {amenities.map((amenity, index) => {
              const IconComponent = amenity.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="text-center hover-lift cursor-pointer h-full">
                    <CardContent className="p-8">
                      <img
                        src={amenity.image}
                        alt={amenity.title}
                        className="w-full h-48 object-cover rounded-xl mb-6"
                      />
                      <div className="flex justify-center mb-4">
                        <IconComponent size={32} className="text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-4">{amenity.title}</h3>
                      <p className="text-muted-foreground">{amenity.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Vị Trí Đắc Địa</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-6">
                <MapPin className="inline mr-2 text-primary" />
                Trung Tâm Thành Phố
              </h3>
              <div className="space-y-4">
                {[
                  { icon: "✈️", text: "Sân bay quốc tế - 15 phút" },
                  { icon: "🛍️", text: "Trung tâm mua sắm - 5 phút" },
                  { icon: "🍽️", text: "Khu ẩm thực - 3 phút" },
                  { icon: "📷", text: "Điểm tham quan - 10 phút" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <Card className="p-4">
              <img
                src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&h=600"
                alt="City skyline"
                className="w-full h-80 object-cover rounded-xl"
              />
              <div className="mt-4 text-center">
                <Button>
                  <MapPin className="mr-2" size={16} />
                  Xem bản đồ chi tiết
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Special Offers */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Ưu Đãi Đặc Biệt</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {offers.map((offer, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className={`bg-gradient-to-r ${offer.gradient} text-white hover-lift cursor-pointer`}>
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold">{offer.title}</h3>
                      <Badge variant="secondary" className="bg-white text-gray-800">
                        {offer.discount}
                      </Badge>
                    </div>
                    <p className="mb-6">{offer.description}</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-lg line-through opacity-75">
                          {offer.originalPrice}
                        </span>
                        <span className="text-3xl font-bold ml-2">
                          {offer.discountPrice}
                        </span>
                      </div>
                      <Button variant="secondary" className="text-gray-800">
                        Đặt ngay
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
