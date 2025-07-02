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
  LogIn,
  LogOut,
  Settings,
  BarChart3,
  PieChart
} from "lucide-react";
import { authManager } from "@/lib/auth";

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

  // Calculate statistics
  const roomsArray = Array.isArray(rooms) ? rooms : [];
  const bookingsArray = Array.isArray(bookings) ? bookings : [];
  
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

  const monthRevenue = bookingsArray.reduce((sum: number, booking: any) => {
    const bookingDate = new Date(booking.createdAt);
    const now = new Date();
    if (bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear()) {
      return sum + parseFloat(booking.totalPrice || 0);
    }
    return sum;
  }, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Bảng Điều Khiển - Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Chào mừng {user?.firstName} {user?.lastName}, hệ thống quản lý khách sạn
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Rooms */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng Phòng</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRooms}</div>
              <p className="text-xs text-muted-foreground">
                {availableRooms} phòng trống
              </p>
            </CardContent>
          </Card>

          {/* Current Guests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Khách Hiện Tại</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentGuests}</div>
              <p className="text-xs text-muted-foreground">
                Tỷ lệ lấp đầy: {occupancyRate}%
              </p>
            </CardContent>
          </Card>

          {/* Today Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Doanh Thu Hôm Nay</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(todayRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Tháng này: {formatCurrency(monthRevenue)}
              </p>
            </CardContent>
          </Card>

          {/* Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đặt Phòng</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{confirmedBookings + pendingBookings}</div>
              <p className="text-xs text-muted-foreground">
                {pendingBookings} chờ xác nhận
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Đặt Phòng Gần Đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookingsArray.slice(0, 5).map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{booking.user?.firstName} {booking.user?.lastName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Phòng {booking.room?.number} - {booking.guests} khách
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(booking.checkIn).toLocaleDateString('vi-VN')} - {new Date(booking.checkOut).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        booking.status === 'confirmed' ? 'default' :
                        booking.status === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {booking.status === 'confirmed' ? 'Đã xác nhận' :
                         booking.status === 'pending' ? 'Chờ xác nhận' : 'Đã hủy'}
                      </Badge>
                      <p className="text-sm font-medium mt-1">
                        {formatCurrency(parseFloat(booking.totalPrice || 0))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Thao Tác Nhanh
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button className="h-20 flex-col gap-2" variant="outline">
                  <LogIn className="h-6 w-6" />
                  <span className="text-sm">Check-in</span>
                </Button>
                <Button className="h-20 flex-col gap-2" variant="outline">
                  <LogOut className="h-6 w-6" />
                  <span className="text-sm">Check-out</span>
                </Button>
                <Button className="h-20 flex-col gap-2" variant="outline">
                  <Calendar className="h-6 w-6" />
                  <span className="text-sm">Đặt Phòng Mới</span>
                </Button>
                <Button className="h-20 flex-col gap-2" variant="outline">
                  <Users className="h-6 w-6" />
                  <span className="text-sm">Quản Lý Khách</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Biểu Đồ Doanh Thu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">Biểu đồ doanh thu theo tháng</p>
                  <p className="text-sm text-gray-500">Tích hợp chart library để hiển thị</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Occupancy Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Tỷ Lệ Lấp Đầy Phòng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                  <PieChart className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">Biểu đồ tỷ lệ đặt phòng</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Phòng có khách:</span>
                      <span className="font-medium">{occupiedRooms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phòng trống:</span>
                      <span className="font-medium">{availableRooms}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}