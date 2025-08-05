import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Award,
  Calendar,
  Clock,
  Facebook,
  Globe,
  Headphones,
  Heart,
  Instagram,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Shield,
  Star,
  Twitter,
  Users,
  Youtube,
} from "lucide-react";
import { useState } from "react";

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "",
    message: "",
    preferredContact: "email",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
          preferredContact: "email",
        });
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      toast({
        title: "Lỗi gửi tin nhắn",
        description:
          "Vui lòng thử lại sau hoặc liên hệ trực tiếp qua điện thoại.",
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
      color: "text-blue-600",
    },
    {
      icon: Phone,
      title: "Hotline",
      details: ["+84 28 3829 2929", "+84 901 234 567"],
      color: "text-green-600",
    },
    {
      icon: Mail,
      title: "Email",
      details: ["info@hotellux.com", "reservation@hotellux.com"],
      color: "text-purple-600",
    },
    {
      icon: Clock,
      title: "Giờ làm việc",
      details: [
        "24/7 - Phục vụ không ngừng nghỉ",
        "Lễ tân luôn sẵn sàng hỗ trợ",
      ],
      color: "text-orange-600",
    },
  ];

  const socialLinks = [
    { icon: Facebook, name: "Facebook", url: "#", color: "bg-blue-600" },
    { icon: Instagram, name: "Instagram", url: "#", color: "bg-pink-600" },
    { icon: Twitter, name: "Twitter", url: "#", color: "bg-blue-400" },
    { icon: Youtube, name: "YouTube", url: "#", color: "bg-red-600" },
  ];

  const services = [
    {
      icon: Headphones,
      title: "Hỗ trợ 24/7",
      description: "Luôn sẵn sàng giải đáp mọi thắc mắc",
    },
    {
      icon: Calendar,
      title: "Đặt phòng dễ dàng",
      description: "Quy trình đặt phòng đơn giản, nhanh chóng",
    },
    {
      icon: Award,
      title: "Chất lượng cao",
      description: "Dịch vụ đạt tiêu chuẩn quốc tế 5 sao",
    },
    {
      icon: Shield,
      title: "An toàn tuyệt đối",
      description: "Bảo mật thông tin và an toàn tài sản",
    },
  ];

  const stats = [
    {
      icon: Users,
      number: "10,000+",
      label: "Khách hàng hài lòng",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Star,
      number: "4.9/5",
      label: "Đánh giá trung bình",
      color: "from-yellow-500 to-yellow-600",
    },
    {
      icon: Globe,
      number: "50+",
      label: "Quốc gia phục vụ",
      color: "from-green-500 to-green-600",
    },
    {
      icon: Heart,
      number: "15",
      label: "Năm kinh nghiệm",
      color: "from-red-500 to-red-600",
    },
  ];

  const faqs = [
    {
      question: "Làm thế nào để đặt phòng?",
      answer:
        "Bạn có thể đặt phòng trực tuyến qua website, gọi điện trực tiếp hoặc đến tại khách sạn.",
    },
    {
      question: "Chính sách hủy phòng như thế nào?",
      answer:
        "Miễn phí hủy phòng trước 48 giờ. Hủy trong vòng 24-48 giờ tính phí 50%, dưới 24 giờ tính phí 100%.",
    },
    {
      question: "Khách sạn có dịch vụ đưa đón sân bay không?",
      answer:
        "Có, chúng tôi cung cấp dịch vụ đưa đón sân bay 24/7 với mức phí hợp lý.",
    },
    {
      question: "Có cho phép mang theo thú cưng không?",
      answer:
        "Chúng tôi chào đón thú cưng tại một số loại phòng nhất định. Vui lòng liên hệ trước khi đặt phòng.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4 shadow-lg">
            <MessageSquare className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Liên hệ với chúng tôi
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Đội ngũ HotelLux luôn sẵn sàng hỗ trợ bạn 24/7. Hãy gửi tin nhắn
            hoặc liên hệ trực tiếp với chúng tôi!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -top-8 left-0 w-full flex justify-center">
              <span className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-4 py-1 rounded-full text-xs font-semibold shadow animate-fadeInUp">
                Chúng tôi luôn lắng nghe bạn!
              </span>
            </div>
            <Card className="rounded-3xl shadow-xl border-0 bg-white/90 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <MessageSquare className="mr-2 text-blue-600" size={22} />
                  Gửi tin nhắn cho chúng tôi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="relative">
                      <Label
                        htmlFor="name"
                        className="text-xs font-semibold mb-1 block"
                      >
                        Họ và tên *
                      </Label>
                      <span className="absolute left-3 top-9 text-blue-400">
                        <Users size={16} />
                      </span>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                        className="mt-1 rounded-xl px-8 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div className="relative">
                      <Label
                        htmlFor="phone"
                        className="text-xs font-semibold mb-1 block"
                      >
                        Số điện thoại
                      </Label>
                      <span className="absolute left-3 top-9 text-blue-400">
                        <Phone size={16} />
                      </span>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="mt-1 rounded-xl px-8 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <Label
                      htmlFor="email"
                      className="text-xs font-semibold mb-1 block"
                    >
                      Email *
                    </Label>
                    <span className="absolute left-3 top-9 text-blue-400">
                      <Mail size={16} />
                    </span>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      className="mt-1 rounded-xl px-8 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div className="relative">
                    <Label
                      htmlFor="subject"
                      className="text-xs font-semibold mb-1 block"
                    >
                      Tiêu đề
                    </Label>
                    <span className="absolute left-3 top-9 text-blue-400">
                      <Star size={16} />
                    </span>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      placeholder="Nhập tiêu đề cho tin nhắn"
                      className="mt-1 rounded-xl px-8 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div className="relative">
                    <Label
                      htmlFor="message"
                      className="text-xs font-semibold mb-1 block"
                    >
                      Tin nhắn *
                    </Label>
                    <span className="absolute left-3 top-9 text-blue-400">
                      <MessageSquare size={16} />
                    </span>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      required
                      rows={5}
                      className="mt-1 rounded-xl px-8 py-2 text-sm focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-xl text-base py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-lg hover:scale-105 transition"
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

          {/* Contact Information + Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6 flex flex-col items-center"
          >
            {/* Hình minh họa */}
            <div className="w-full flex justify-center mb-2">
              <img
                src="https://assets-global.website-files.com/5e9aa66fd3886c1ecf5b4c2a/63e0e2e2b1b7e2b1e2b1e2b1_contact-illustration.svg"
                alt="Contact Illustration"
                className="w-64 h-40 object-contain drop-shadow-lg rounded-2xl"
                loading="lazy"
              />
            </div>
            <Card className="rounded-2xl shadow-md border-0 w-full">
              <CardHeader>
                <CardTitle className="text-base">Thông tin liên hệ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-md`}
                    >
                      <info.icon className="text-white" size={22} />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1 text-base text-blue-700">
                        {info.title}
                      </h4>
                      {info.details.map((detail, i) => (
                        <p key={i} className="text-muted-foreground text-sm">
                          {detail}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
                {/* Map Placeholder */}
                <div className="h-36 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center relative overflow-hidden mt-4 shadow">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="text-white text-center relative z-10">
                    <MapPin className="mx-auto mb-2" size={22} />
                    <p className="font-semibold text-base">HotelLux Premium</p>
                    <p className="text-sm text-blue-100 mb-1">
                      123 Đường Nguyễn Huệ, Quận 1
                    </p>
                    <p className="text-sm text-blue-100">
                      TP. Hồ Chí Minh, Việt Nam
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-2 bg-white/90 text-blue-600 hover:bg-white rounded-full px-4 py-1 text-xs shadow"
                    >
                      Xem trên bản đồ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
