import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { motion } from "framer-motion";
import {
  Calendar,
  Car,
  ChevronRight,
  Coffee,
  Mail,
  MapPin,
  Phone,
  Search,
  Star,
  Users,
  Wifi,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Home() {
  const { t } = useTranslation();
  const [searchData, setSearchData] = useState({
    checkIn: "",
    checkOut: "",
    guests: "2",
  });

  const featuredRooms = [
    {
      id: 1,
      name: t("rooms.roomType.deluxe"),
      type: "deluxe",
      price: "1,500,000",
      image:
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      amenities: [t("common.wifi"), t("common.ac"), "TV LCD", "Minibar"],
      rating: 4.8,
      reviews: 124,
    },
    {
      id: 2,
      name: t("rooms.roomType.suite"),
      type: "suite",
      price: "2,800,000",
      image:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      amenities: [
        t("common.oceanView"),
        "Jacuzzi",
        t("common.livingRoom"),
        "Butler",
      ],
      rating: 4.9,
      reviews: 89,
    },
    {
      id: 3,
      name: t("rooms.roomType.presidential"),
      type: "presidential",
      price: "5,000,000",
      image:
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      amenities: [
        t("common.bedrooms"),
        t("common.fullKitchen"),
        t("common.balcony"),
        t("common.service24h"),
      ],
      rating: 5.0,
      reviews: 45,
    },
  ];

  const services = [
    {
      icon: Wifi,
      title: t("common.wifi"),
      description: t("common.wifiDesc"),
    },
    {
      icon: Car,
      title: t("common.parking"),
      description: t("common.parkingDesc"),
    },
    {
      icon: Coffee,
      title: t("common.restaurant"),
      description: t("common.restaurantDesc"),
    },
    {
      icon: Users,
      title: t("common.concierge"),
      description: t("common.conciergeDesc"),
    },
  ];

  // Thêm section đánh giá khách hàng (testimonial)
  const testimonials = [
    {
      name: "Nguyễn Văn A",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      comment:
        "Khách sạn rất đẹp, dịch vụ tuyệt vời, nhân viên thân thiện. Tôi sẽ quay lại!",
      rating: 5,
    },
    {
      name: "Trần Thị B",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      comment: "Phòng sạch sẽ, view đẹp, đồ ăn ngon. Rất hài lòng!",
      rating: 4.5,
    },
    {
      name: "Lê Quốc Cường",
      avatar: "https://randomuser.me/api/portraits/men/65.jpg",
      comment: "Giá hợp lý, tiện nghi đầy đủ, đặt phòng nhanh chóng.",
      rating: 4.8,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center text-white overflow-hidden rounded-b-3xl shadow-2xl mb-12">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 blur-[2px]"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')",
          }}
        ></div>
        <div className="absolute inset-0 bg-black/50"></div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4 max-w-3xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 animate-float drop-shadow-lg">
            {t("auth.welcomeMessage")}{" "}
            <span className="text-gradient-3 animate-glow">HotelLux</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 font-medium drop-shadow">
            {t("nav.home")} - {t("rooms.title")}
          </p>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="glass rounded-2xl p-6 shadow-2xl hover-glow backdrop-blur-xl border border-white/30"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("booking.checkIn")}
                </label>
                <input
                  type="date"
                  value={searchData.checkIn}
                  onChange={(e) =>
                    setSearchData({ ...searchData, checkIn: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("booking.checkOut")}
                </label>
                <input
                  type="date"
                  value={searchData.checkOut}
                  onChange={(e) =>
                    setSearchData({ ...searchData, checkOut: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("booking.guests")}
                </label>
                <select
                  value={searchData.guests}
                  onChange={(e) =>
                    setSearchData({ ...searchData, guests: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="1">1 {t("booking.guest")}</option>
                  <option value="2">2 {t("booking.guest")}</option>
                  <option value="3">3 {t("booking.guest")}</option>
                  <option value="4">4 {t("booking.guest")}</option>
                  <option value="5">5+ {t("booking.guest")}</option>
                </select>
              </div>
              <Link href="/booking">
                <Button size="lg" className="w-full btn-primary hover-glow">
                  <Search className="mr-2" size={20} />
                  {t("booking.searchRooms")}
                </Button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Featured Rooms - Carousel scroll-x */}
      <section className="py-10 px-2">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-extrabold mb-2 text-gradient">
              {t("rooms.featured")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("rooms.featuredDescription")}
            </p>
          </motion.div>
          <div className="overflow-x-auto pb-2 -mx-2">
            <div className="flex gap-4 px-2 min-w-[600px] md:min-w-0">
              {featuredRooms.map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="group min-w-[250px] max-w-xs flex-shrink-0"
                >
                  <Card className="card-enhanced hover-grow overflow-hidden shadow-md border-0 rounded-2xl">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={room.image}
                        alt={room.name}
                        className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-500 rounded-2xl"
                      />
                      <div className="absolute top-2 right-2 glass rounded-full px-2 py-0.5 flex items-center backdrop-blur-lg shadow">
                        <Star
                          className="text-yellow-400 mr-1"
                          size={14}
                          fill="currentColor"
                        />
                        <span className="text-xs font-semibold text-white">
                          {room.rating}
                        </span>
                        <span className="text-xs text-white/80 ml-1">
                          ({room.reviews})
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-lg font-bold mb-1 text-primary group-hover:text-gradient-2 transition-all">
                        {room.name}
                      </h3>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(Array.isArray(room.amenities)
                          ? room.amenities
                          : JSON.parse(room.amenities || "[]")
                        )
                          .slice(0, 3)
                          .map((amenity: string, i: number) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-xs bg-primary/10 text-primary border-0 rounded-full px-2 py-0.5 shadow-sm hover:scale-105 transition"
                            >
                              {amenity}
                            </Badge>
                          ))}
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-xl font-bold text-primary">
                            {room.price}đ
                          </span>
                          <span className="text-xs text-muted-foreground">
                            /đêm
                          </span>
                        </div>
                        <Link href="/booking">
                          <Button className="btn-secondary hover-glow group-hover:shadow-md transition-all rounded-full px-4 py-1 text-sm">
                            {t("booking.bookNow")}
                            <ChevronRight className="ml-1" size={14} />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-12 gradient-bg-6">
        <div className="max-w-7xl mx-auto px-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-extrabold mb-2 text-gradient">
              Dịch vụ đẳng cấp
            </h2>
            <p className="text-lg text-gray-700">
              Những tiện ích hiện đại dành cho kỳ nghỉ hoàn hảo
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -3 }}
              >
                <Card className="card-enhanced text-center p-6 hover-grow backdrop-blur-md shadow-md border-0 rounded-2xl">
                  <div
                    className={`w-12 h-12 gradient-bg-${
                      (index % 4) + 1
                    } rounded-full flex items-center justify-center mx-auto mb-2 animate-float shadow-sm`}
                  >
                    <service.icon className="text-white" size={24} />
                  </div>
                  <h3 className="text-lg font-bold mb-1 text-primary group-hover:text-gradient-2 transition-all">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {service.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-10 bg-gradient-to-br from-white via-blue-50 to-purple-50">
        <div className="max-w-5xl mx-auto px-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-extrabold mb-2 text-gradient">
              Khách hàng nói gì về chúng tôi
            </h2>
            <p className="text-lg text-muted-foreground">
              Đánh giá thực tế từ khách hàng đã trải nghiệm dịch vụ tại HotelLux
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center hover:shadow-xl hover:-translate-y-1 transition"
              >
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-16 h-16 rounded-full mb-3 border-2 border-primary/20 shadow-sm"
                />
                <div className="flex mb-1">
                  {Array.from({ length: Math.floor(item.rating) }).map(
                    (_, i) => (
                      <Star
                        key={i}
                        className="text-yellow-400"
                        size={16}
                        fill="currentColor"
                      />
                    )
                  )}
                  {item.rating % 1 !== 0 && (
                    <Star
                      className="text-yellow-400"
                      size={16}
                      fill="currentColor"
                      style={{ opacity: 0.5 }}
                    />
                  )}
                </div>
                <p className="text-base text-gray-700 italic mb-2 text-center">
                  “{item.comment}”
                </p>
                <div className="font-semibold text-primary text-sm">
                  {item.name}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-extrabold mb-4 text-gradient">
                Liên hệ với chúng tôi
              </h2>
              <p className="text-lg text-muted-foreground mb-4">
                Đội ngũ chuyên nghiệp của HotelLux luôn sẵn sàng hỗ trợ bạn 24/7
              </p>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <MapPin className="text-primary" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Địa chỉ</h4>
                    <p className="text-muted-foreground text-sm">
                      123 Đường ABC, Quận 1, TP.HCM
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Phone className="text-primary" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Điện thoại</h4>
                    <p className="text-muted-foreground text-sm">
                      +84 123 456 789
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="text-primary" size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Email</h4>
                    <p className="text-muted-foreground text-sm">
                      info@hotellux.com
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="gradient-bg-1 rounded-2xl p-8 text-white glass hover-glow shadow-lg"
            >
              <h3 className="text-xl font-extrabold mb-2 animate-fadeInUp">
                {t("common.bookToday")}
              </h3>
              <p className="mb-4 text-white/90 text-sm">
                {t("common.specialOffer")}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between animate-slideInLeft text-sm">
                  <span>{t("common.discountUpTo")}:</span>
                  <span className="text-xl font-bold text-yellow-300 animate-glow">
                    20%
                  </span>
                </div>
                <div className="flex items-center justify-between animate-slideInLeft text-sm">
                  <span>Check-in sớm miễn phí</span>
                  <span className="text-green-300 animate-bounce">✓</span>
                </div>
                <div className="flex items-center justify-between animate-slideInLeft text-sm">
                  <span>Wifi tốc độ cao</span>
                  <span className="text-green-300 animate-bounce">✓</span>
                </div>
                <Link href="/booking">
                  <Button className="w-full bg-white text-blue-600 hover:bg-gray-100 font-semibold mt-2 btn-glow hover-scale shadow rounded-full py-2">
                    <Calendar className="mr-2" size={18} />
                    {t("booking.bookNow")}
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
