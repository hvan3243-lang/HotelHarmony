import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Home, 
  Calendar, 
  DollarSign, 
  Activity,
  TrendingUp,
  Bed,
  Star,
  BarChart3,
  PieChart
} from "lucide-react";
import { authManager } from "@/lib/auth";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const user = authManager.getUser();
  
  const { data: rooms } = useQuery({
    queryKey: ["/api/rooms"],
    enabled: !!user,
  });

  const { data: bookings } = useQuery({
    queryKey: ["/api/bookings"],
    enabled: !!user,
  });

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
    enabled: !!user,
  });

  // Calculate statistics
  const roomsArray = Array.isArray(rooms) ? rooms : [];
  const bookingsArray = Array.isArray(bookings) ? bookings : [];
  const servicesArray = Array.isArray(services) ? services : [];
  
  const totalRooms = roomsArray.length;
  const availableRooms = roomsArray.filter((room: any) => room.status === 'available').length;
  const occupiedRooms = totalRooms - availableRooms;
  const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;

  const confirmedBookings = bookingsArray.filter((booking: any) => booking.status === 'confirmed').length;
  const pendingBookings = bookingsArray.filter((booking: any) => booking.status === 'pending').length;
  const currentGuests = confirmedBookings * 2; // Estimate

  // Revenue calculation (simplified)
  const todayRevenue = bookingsArray.reduce((sum: number, booking: any) => {
    const bookingDate = new Date(booking.createdAt);
    const today = new Date();
    if (bookingDate.toDateString() === today.toDateString()) {
      return sum + parseFloat(booking.totalPrice || 0);
    }
    return sum;
  }, 0);

  const monthlyRevenue = bookingsArray.reduce((sum: number, booking: any) => {
    const bookingDate = new Date(booking.createdAt);
    const today = new Date();
    if (bookingDate.getMonth() === today.getMonth() && bookingDate.getFullYear() === today.getFullYear()) {
      return sum + parseFloat(booking.totalPrice || 0);
    }
    return sum;
  }, 0);

  // Chart data
  const roomTypeData = [
    { name: 'Standard', value: roomsArray.filter((r: any) => r.type === 'standard').length },
    { name: 'Deluxe', value: roomsArray.filter((r: any) => r.type === 'deluxe').length },
    { name: 'Suite', value: roomsArray.filter((r: any) => r.type === 'suite').length },
    { name: 'Presidential', value: roomsArray.filter((r: any) => r.type === 'presidential').length },
  ].filter(item => item.value > 0);

  const bookingStatusData = [
    { name: 'Đã xác nhận', value: confirmedBookings },
    { name: 'Chờ xử lý', value: pendingBookings },
    { name: 'Đã hủy', value: bookingsArray.filter((b: any) => b.status === 'cancelled').length },
  ].filter(item => item.value > 0);

  // Monthly revenue data (last 6 months)
  const monthlyRevenueData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthRevenue = bookingsArray
      .filter((b: any) => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate.getMonth() === date.getMonth() && 
               bookingDate.getFullYear() === date.getFullYear();
      })
      .reduce((sum: number, b: any) => sum + parseFloat(b.totalPrice || 0), 0);
    
    monthlyRevenueData.push({
      month: date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
      revenue: monthRevenue
    });
  }

  // Daily bookings data (last 7 days)
  const dailyBookingsData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayBookings = bookingsArray.filter((b: any) => {
      const bookingDate = new Date(b.createdAt);
      return bookingDate.toDateString() === date.toDateString();
    }).length;
    
    dailyBookingsData.push({
      day: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
      bookings: dayBookings
    });
  }

  const stats = [
    {
      title: "Tổng số phòng",
      value: totalRooms.toString(),
      icon: Home,
      description: `${availableRooms} phòng trống`,
      trend: "+2.5%",
      color: "text-blue-600"
    },
    {
      title: "Khách hiện tại",
      value: currentGuests.toString(),
      icon: Users,
      description: `Tỷ lệ lấp đầy ${occupancyRate}%`,
      trend: "+12.3%",
      color: "text-green-600"
    },
    {
      title: "Đặt phòng hôm nay",
      value: bookingsArray.filter((b: any) => {
        const today = new Date();
        const bookingDate = new Date(b.createdAt);
        return bookingDate.toDateString() === today.toDateString();
      }).length.toString(),
      icon: Calendar,
      description: `${pendingBookings} chờ xử lý`,
      trend: "+5.2%",
      color: "text-orange-600"
    },
    {
      title: "Doanh thu tháng",
      value: `${monthlyRevenue.toLocaleString('vi-VN')}₫`,
      icon: DollarSign,
      description: `Hôm nay: ${todayRevenue.toLocaleString('vi-VN')}₫`,
      trend: "+18.7%",
      color: "text-purple-600"
    }
  ];

  const quickActions = [
    { title: "Thêm đặt phòng mới", href: "/booking", icon: Calendar },
    { title: "Quản lý phòng", href: "/admin", icon: Home },
    { title: "Quản lý dịch vụ", href: "/services", icon: Star },
    { title: "Báo cáo chi tiết", href: "#", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard Quản lý
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Chào mừng trở lại, {user?.firstName}! Đây là tổng quan hệ thống hôm nay.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Activity className="h-3 w-3 mr-1" />
              Hệ thống hoạt động tốt
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {stat.description}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-xs text-green-500">{stat.trend}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Doanh thu 6 tháng gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any) => [`${value.toLocaleString('vi-VN')}₫`, 'Doanh thu']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8884d8" 
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Daily Bookings Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Đặt phòng 7 ngày gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyBookingsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Room Types Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Phân bố loại phòng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={roomTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {roomTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Booking Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Trạng thái đặt phòng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={bookingStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {bookingStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-16 flex flex-col items-center justify-center gap-2"
                  onClick={() => action.href !== '#' && (window.location.href = action.href)}
                >
                  <action.icon className="h-5 w-5" />
                  <span className="text-xs text-center">{action.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}