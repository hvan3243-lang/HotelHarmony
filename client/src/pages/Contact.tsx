import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send,
  MessageSquare,
  Star,
  CheckCircle,
  Globe,
  Users,
  Heart,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Headphones,
  Calendar,
  Award,
  Shield,
  Zap,
  Coffee
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "",
    message: "",
    preferredContact: "email"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Tin nhắn đã được gửi!",
          description: "Chúng tôi sẽ phản hồi bạn trong vòng 24 giờ.",
        });
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          category: "",
          message: "",
          preferredContact: "email"
        });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast({
        title: "Lỗi gửi tin nhắn",
        description: "Vui lòng thử lại sau hoặc liên hệ trực tiếp qua điện thoại.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Địa chỉ",
      details: ["123 Đường Nguyễn Huệ, Quận 1", "TP. Hồ Chí Minh, Việt Nam"],
      color: "text-blue-600"
    },
    {
      icon: Phone,
      title: "Hotline",
      details: ["+84 28 3829 2929", "+84 901 234 567"],
      color: "text-green-600"
    },
    {
      icon: Mail,
      title: "Email",
      details: ["info@hotellux.com", "reservation@hotellux.com"],
      color: "text-purple-600"
    },
    {
      icon: Clock,
      title: "Giờ làm việc",
      details: ["24/7 - Phục vụ không ngừng nghỉ", "Lễ tân luôn sẵn sàng hỗ trợ"],
      color: "text-orange-600"
    }
  ];

  const socialLinks = [
    { icon: Facebook, name: "Facebook", url: "#", color: "bg-blue-600" },
    { icon: Instagram, name: "Instagram", url: "#", color: "bg-pink-600" },
    { icon: Twitter, name: "Twitter", url: "#", color: "bg-blue-400" },
    { icon: Youtube, name: "YouTube", url: "#", color: "bg-red-600" }
  ];

  const services = [
    { icon: Headphones, title: "Hỗ trợ 24/7", description: "Luôn sẵn sàng giải đáp mọi thắc mắc" },
    { icon: Calendar, title: "Đặt phòng dễ dàng", description: "Quy trình đặt phòng đơn giản, nhanh chóng" },
    { icon: Award, title: "Chất lượng cao", description: "Dịch vụ đạt tiêu chuẩn quốc tế 5 sao" },
    { icon: Shield, title: "An toàn tuyệt đối", description: "Bảo mật thông tin và an toàn tài sản" }
  ];

  const stats = [
    {
      icon: Users,
      number: "10,000+",
      label: "Khách hàng hài lòng",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Star,
      number: "4.9/5",
      label: "Đánh giá trung bình",
      color: "from-yellow-500 to-yellow-600"
    },
    {
      icon: Globe,
      number: "50+",
      label: "Quốc gia phục vụ",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Heart,
      number: "15",
      label: "Năm kinh nghiệm",
      color: "from-red-500 to-red-600"
    }
  ];

  const faqs = [
    {
      question: "Làm thế nào để đặt phòng?",
      answer: "Bạn có thể đặt phòng trực tuyến qua website, gọi điện trực tiếp hoặc đến tại khách sạn."
    },
    {
      question: "Chính sách hủy phòng như thế nào?",
      answer: "Miễn phí hủy phòng trước 48 giờ. Hủy trong vòng 24-48 giờ tính phí 50%, dưới 24 giờ tính phí 100%."
    },
    {
      question: "Khách sạn có dịch vụ đưa đón sân bay không?",
      answer: "Có, chúng tôi cung cấp dịch vụ đưa đón sân bay 24/7 với mức phí hợp lý."
    },
    {
      question: "Có cho phép mang theo thú cưng không?",
      answer: "Chúng tôi chào đón thú cưng tại một số loại phòng nhất định. Vui lòng liên hệ trước khi đặt phòng."
    }
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
            <MessageSquare className="text-white" size={32} />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Liên hệ với chúng tôi
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Đội ngũ chuyên viên tư vấn của HotelLux luôn sẵn sàng hỗ trợ bạn 24/7. 
            Hãy liên hệ để được tư vấn tốt nhất và trải nghiệm dịch vụ đẳng cấp!
          </p>
        </motion.div>

        {/* Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {services.map((service, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 group hover:scale-105">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <service.icon className="text-white" size={24} />
                </div>
                <h3 className="font-semibold mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <Card key={index} className="text-center border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <div className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <stat.icon className="text-white" size={24} />
                </div>
                <div className="text-2xl font-bold mb-1">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2" size={24} />
                  Gửi tin nhắn cho chúng tôi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Họ và tên *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Số điện thoại</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Chủ đề liên hệ</Label>
                      <Select onValueChange={(value) => setFormData({...formData, category: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Chọn chủ đề" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="booking">Đặt phòng</SelectItem>
                          <SelectItem value="inquiry">Tư vấn dịch vụ</SelectItem>
                          <SelectItem value="complaint">Khiếu nại</SelectItem>
                          <SelectItem value="feedback">Góp ý</SelectItem>
                          <SelectItem value="partnership">Hợp tác</SelectItem>
                          <SelectItem value="other">Khác</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="contact-method">Cách liên hệ ưu tiên</Label>
                      <Select onValueChange={(value) => setFormData({...formData, preferredContact: value})} defaultValue="email">
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Điện thoại</SelectItem>
                          <SelectItem value="both">Cả hai</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject">Tiêu đề</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      placeholder="Nhập tiêu đề cho tin nhắn"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Tin nhắn *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      required
                      rows={5}
                      className="mt-1"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Đang gửi..."
                    ) : (
                      <>
                        <Send className="mr-2" size={16} />
                        Gửi tin nhắn
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* Contact Details */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin liên hệ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className={`w-12 h-12 bg-muted rounded-full flex items-center justify-center flex-shrink-0`}>
                      <info.icon className={info.color} size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{info.title}</h4>
                      {info.details.map((detail, i) => (
                        <p key={i} className="text-muted-foreground text-sm">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card>
              <CardHeader>
                <CardTitle>Kết nối với chúng tôi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {socialLinks.map((social, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-4 flex items-center space-x-3 hover:scale-105 transition-transform"
                      onClick={() => window.open(social.url, '_blank')}
                    >
                      <div className={`w-10 h-10 ${social.color} rounded-full flex items-center justify-center`}>
                        <social.icon className="text-white" size={18} />
                      </div>
                      <span className="font-medium">{social.name}</span>
                    </Button>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <div className="flex items-center justify-center space-x-4">
                    <Zap className="text-yellow-500" size={20} />
                    <span className="text-sm text-muted-foreground">
                      Theo dõi chúng tôi để nhận ưu đãi đặc biệt!
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Vị trí của chúng tôi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="text-white text-center relative z-10">
                    <MapPin className="mx-auto mb-2" size={32} />
                    <p className="font-semibold text-lg">HotelLux Premium</p>
                    <p className="text-sm text-blue-100 mb-2">123 Đường Nguyễn Huệ, Quận 1</p>
                    <p className="text-sm text-blue-100">TP. Hồ Chí Minh, Việt Nam</p>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="mt-3 bg-white/90 text-blue-600 hover:bg-white"
                    >
                      Xem trên bản đồ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">Câu hỏi thường gặp</CardTitle>
              <p className="text-center text-muted-foreground">
                Những câu hỏi phổ biến từ khách hàng
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {faqs.map((faq, index) => (
                  <div key={index} className="space-y-3">
                    <h4 className="font-semibold flex items-start">
                      <CheckCircle className="text-green-600 mr-2 mt-0.5 flex-shrink-0" size={16} />
                      {faq.question}
                    </h4>
                    <p className="text-muted-foreground text-sm ml-6">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16"
        >
          <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <CardContent className="p-8 text-center relative z-10">
              <div className="flex justify-center mb-4">
                <div className="flex items-center space-x-2">
                  <Coffee className="text-yellow-300" size={24} />
                  <Star className="text-yellow-300" size={24} />
                  <Heart className="text-red-300" size={24} />
                </div>
              </div>
              <h3 className="text-3xl font-bold mb-4">
                Sẵn sàng trải nghiệm HotelLux?
              </h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto text-lg">
                Đặt phòng ngay hôm nay để nhận những ưu đãi đặc biệt và trải nghiệm dịch vụ đẳng cấp thế giới. 
                Chúng tôi cam kết mang đến cho bạn kỳ nghỉ đáng nhớ nhất!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-3 text-lg hover:scale-105 transition-transform"
                  onClick={() => window.location.href = '/booking'}
                >
                  Đặt phòng ngay
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-3 text-lg hover:scale-105 transition-transform"
                  onClick={() => window.location.href = '/'}
                >
                  Xem phòng có sẵn
                </Button>
              </div>
              <div className="mt-6 flex items-center justify-center space-x-4 text-sm text-blue-100">
                <div className="flex items-center space-x-1">
                  <CheckCircle size={16} />
                  <span>Miễn phí hủy phòng</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle size={16} />
                  <span>Hỗ trợ 24/7</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle size={16} />
                  <span>Giá tốt nhất</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}