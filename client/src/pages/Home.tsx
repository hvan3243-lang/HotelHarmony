import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  Wifi, 
  Car, 
  Coffee, 
  Users, 
  MapPin, 
  Phone, 
  Mail,
  ChevronRight,
  Calendar,
  Search
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function Home() {
  const [searchData, setSearchData] = useState({
    checkIn: "",
    checkOut: "",
    guests: "2"
  });

  const featuredRooms = [
    {
      id: 1,
      name: "Phòng Deluxe",
      type: "deluxe",
      price: "1,500,000",
      image: "/api/placeholder/400/300",
      amenities: ["Wifi miễn phí", "Điều hòa", "TV LCD", "Minibar"],
      rating: 4.8,
      reviews: 124
    },
    {
      id: 2,
      name: "Phòng Suite",
      type: "suite", 
      price: "2,800,000",
      image: "/api/placeholder/400/300",
      amenities: ["View biển", "Jacuzzi", "Phòng khách riêng", "Butler"],
      rating: 4.9,
      reviews: 89
    },
    {
      id: 3,
      name: "Phòng Presidential",
      type: "presidential",
      price: "5,000,000", 
      image: "/api/placeholder/400/300",
      amenities: ["2 phòng ngủ", "Bếp đầy đủ", "Ban công rộng", "Dịch vụ 24/7"],
      rating: 5.0,
      reviews: 45
    }
  ];

  const services = [
    {
      icon: Wifi,
      title: "Wifi miễn phí",
      description: "Internet tốc độ cao trong toàn bộ khách sạn"
    },
    {
      icon: Car,
      title: "Đỗ xe miễn phí",
      description: "Bãi đỗ xe an toàn và rộng rãi"
    },
    {
      icon: Coffee,
      title: "Nhà hàng 5 sao",
      description: "Ẩm thực đa dạng phục vụ 24/7"
    },
    {
      icon: Users,
      title: "Dịch vụ concierge",
      description: "Hỗ trợ khách hàng chuyên nghiệp"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center gradient-bg-1 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 backdrop-blur-sm"></div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-float">
            Chào mừng đến với <span className="text-gradient-3 animate-glow">HotelLux</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 font-medium">
            Trải nghiệm nghỉ dưỡng đẳng cấp với dịch vụ hoàn hảo
          </p>
          
          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="glass rounded-2xl p-6 shadow-2xl hover-glow"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày nhận phòng</label>
                <input
                  type="date"
                  value={searchData.checkIn}
                  onChange={(e) => setSearchData({...searchData, checkIn: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày trả phòng</label>
                <input
                  type="date"
                  value={searchData.checkOut}
                  onChange={(e) => setSearchData({...searchData, checkOut: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2">Số khách</label>
                <select
                  value={searchData.guests}
                  onChange={(e) => setSearchData({...searchData, guests: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="1">1 khách</option>
                  <option value="2">2 khách</option>
                  <option value="3">3 khách</option>
                  <option value="4">4 khách</option>
                  <option value="5">5+ khách</option>
                </select>
              </div>
              <Link href="/booking">
                <Button size="lg" className="w-full btn-primary hover-glow">
                  <Search className="mr-2" size={20} />
                  Tìm phòng
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Featured Rooms */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Phòng nổi bật</h2>
            <p className="text-xl text-muted-foreground">Khám phá những phòng nghỉ sang trọng nhất của chúng tôi</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredRooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <Card className="card-enhanced hover-grow overflow-hidden">
                  <div className="relative h-64 overflow-hidden">
                    <div className={`w-full h-full gradient-bg-${(index % 5) + 1} flex items-center justify-center`}>
                      <span className="text-white text-lg font-semibold animate-float">{room.name}</span>
                    </div>
                    <div className="absolute top-4 right-4 glass rounded-full px-3 py-1 flex items-center backdrop-blur-lg">
                      <Star className="text-yellow-400 mr-1" size={16} fill="currentColor" />
                      <span className="text-sm font-semibold text-white">{room.rating}</span>
                      <span className="text-xs text-white/80 ml-1">({room.reviews})</span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{room.name}</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {room.amenities.slice(0, 3).map((amenity, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-2xl font-bold text-primary">{room.price}đ</span>
                        <span className="text-sm text-muted-foreground">/đêm</span>
                      </div>
                      <Link href="/booking">
                        <Button className="btn-secondary hover-glow group-hover:shadow-lg transition-all">
                          Đặt ngay
                          <ChevronRight className="ml-1" size={16} />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 gradient-bg-6">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4 text-gradient">Dịch vụ đẳng cấp</h2>
            <p className="text-xl text-gray-700">Những tiện ích hiện đại dành cho kỳ nghỉ hoàn hảo</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -5 }}
              >
                <Card className="card-enhanced text-center p-6 hover-grow backdrop-blur-md">
                  <div className={`w-16 h-16 gradient-bg-${(index % 4) + 1} rounded-full flex items-center justify-center mx-auto mb-4 animate-float`}>
                    <service.icon className="text-white" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                  <p className="text-muted-foreground">{service.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold mb-6">Liên hệ với chúng tôi</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Đội ngũ chuyên nghiệp của HotelLux luôn sẵn sàng hỗ trợ bạn 24/7
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <MapPin className="text-primary" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold">Địa chỉ</h4>
                    <p className="text-muted-foreground">123 Đường ABC, Quận 1, TP.HCM</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Phone className="text-primary" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold">Điện thoại</h4>
                    <p className="text-muted-foreground">+84 123 456 789</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="text-primary" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold">Email</h4>
                    <p className="text-muted-foreground">info@hotellux.com</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="gradient-bg-1 rounded-2xl p-8 text-white glass hover-glow"
            >
              <h3 className="text-2xl font-bold mb-4 animate-fadeInUp">Đặt phòng ngay hôm nay</h3>
              <p className="mb-6 text-white/90">
                Nhận ưu đãi đặc biệt khi đặt phòng trực tiếp qua website
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between animate-slideInLeft">
                  <span>Giảm giá lên đến:</span>
                  <span className="text-2xl font-bold text-yellow-300 animate-glow">20%</span>
                </div>
                <div className="flex items-center justify-between animate-slideInLeft">
                  <span>Check-in sớm miễn phí</span>
                  <span className="text-green-300 animate-bounce">✓</span>
                </div>
                <div className="flex items-center justify-between animate-slideInLeft">
                  <span>Wifi tốc độ cao</span>
                  <span className="text-green-300 animate-bounce">✓</span>
                </div>
                <Link href="/booking">
                  <Button className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold mt-4 btn-glow hover-scale">
                    <Calendar className="mr-2" size={20} />
                    Đặt phòng ngay
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}