import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertUserSchema, insertRoomSchema, insertBookingSchema, insertBlogPostSchema, chatMessages, users, type BlogPost } from "@shared/schema";
import { eq, desc, sql, count } from "drizzle-orm";
import { sendBookingConfirmation } from "./services/sendgrid";
import { db } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
}) : null;

// Auth middleware
const authenticateToken = (req: any, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const requireAdmin = (req: any, res: Response, next: any) => {
  if (req.user.role !== 'admin') {
    return res.sendStatus(403);
  }
  next();
};

// WebSocket connections để thông báo admin
let adminClients: WebSocket[] = [];

// Function để gửi thông báo cho admin
const notifyAdmin = (message: any) => {
  adminClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email đã được sử dụng" });
      }
      
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Room routes
  app.get("/api/rooms", async (req: Request, res: Response) => {
    try {
      const { checkIn, checkOut } = req.query;
      
      let rooms;
      if (checkIn && checkOut) {
        rooms = await storage.getAvailableRooms(new Date(checkIn as string), new Date(checkOut as string));
      } else {
        rooms = await storage.getRooms();
      }
      
      res.json(rooms);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/rooms/:id", async (req: Request, res: Response) => {
    try {
      const room = await storage.getRoom(parseInt(req.params.id));
      if (!room) {
        return res.status(404).json({ message: "Không tìm thấy phòng" });
      }
      res.json(room);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Check room availability for specific dates
  app.post("/api/rooms/check-availability", async (req: Request, res: Response) => {
    try {
      const { checkIn, checkOut, roomId } = req.body;
      
      if (!checkIn || !checkOut) {
        return res.status(400).json({ message: "Vui lòng cung cấp ngày nhận và trả phòng" });
      }
      
      const availableRooms = await storage.getAvailableRooms(
        new Date(checkIn),
        new Date(checkOut)
      );
      
      const isAvailable = roomId ? 
        availableRooms.some(room => room.id === parseInt(roomId)) :
        availableRooms.length > 0;
      
      res.json({
        isAvailable,
        availableRooms: roomId ? [] : availableRooms,
        message: isAvailable ? 
          "Phòng có sẵn cho thời gian này" : 
          "Phòng không có sẵn cho thời gian được chọn"
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/rooms", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const roomData = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(roomData);
      res.json(room);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/rooms/:id", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const room = await storage.updateRoom(parseInt(req.params.id), req.body);
      if (!room) {
        return res.status(404).json({ message: "Không tìm thấy phòng" });
      }
      res.json(room);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/rooms/:id", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteRoom(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Không tìm thấy phòng" });
      }
      res.json({ message: "Xóa phòng thành công" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Booking routes
  app.get("/api/bookings", authenticateToken, async (req: any, res: Response) => {
    try {
      let bookings;
      if (req.user.role === 'admin') {
        bookings = await storage.getBookings();
      } else {
        bookings = await storage.getUserBookings(req.user.id);
      }
      res.json(bookings);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/bookings", authenticateToken, async (req: any, res: Response) => {
    try {
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId: req.user.id,
      });
      
      // Check room availability
      const availableRooms = await storage.getAvailableRooms(
        new Date(bookingData.checkIn),
        new Date(bookingData.checkOut)
      );
      
      if (!availableRooms.find(room => room.id === bookingData.roomId)) {
        return res.status(400).json({ 
          message: "Phòng này đã được đặt cho thời gian bạn chọn. Vui lòng chọn phòng khác hoặc thời gian khác.",
          code: "ROOM_NOT_AVAILABLE"
        });
      }
      
      const booking = await storage.createBooking(bookingData);
      const bookingWithDetails = await storage.getBooking(booking.id);
      
      // Thông báo admin về booking mới
      if (bookingWithDetails) {
        notifyAdmin({
          type: 'new_booking',
          data: {
            id: bookingWithDetails.id,
            customerName: `${req.user.firstName} ${req.user.lastName}`,
            room: `${bookingWithDetails.room.type} - Phòng ${bookingWithDetails.room.number}`,
            checkIn: bookingWithDetails.checkIn,
            checkOut: bookingWithDetails.checkOut,
            totalPrice: bookingWithDetails.totalPrice,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Send confirmation email
      if (bookingWithDetails) {
        await sendBookingConfirmation(
          req.user.email,
          bookingWithDetails,
          bookingWithDetails.room,
          bookingWithDetails.user
        );
      }
      
      res.json(booking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/bookings/:id/cancel", authenticateToken, async (req: any, res: Response) => {
    try {
      const booking = await storage.getBooking(parseInt(req.params.id));
      if (!booking) {
        return res.status(404).json({ message: "Không tìm thấy đặt phòng" });
      }
      
      // Only allow user to cancel their own booking or admin
      if (booking.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: "Không có quyền hủy đặt phòng này" });
      }
      
      // Check if booking can be cancelled based on check-in date
      const checkInDate = new Date(booking.checkIn);
      const now = new Date();
      const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      let refundAmount = 0;
      let refundPercentage = 0;
      
      if (hoursUntilCheckIn > 48) {
        // Full refund if cancelled more than 48 hours before check-in
        refundAmount = parseFloat(booking.totalPrice);
        refundPercentage = 100;
      } else if (hoursUntilCheckIn > 24) {
        // 50% refund if cancelled 24-48 hours before check-in
        refundAmount = parseFloat(booking.totalPrice) * 0.5;
        refundPercentage = 50;
      }
      // No refund if cancelled within 24 hours
      
      const success = await storage.cancelBooking(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Không thể hủy đặt phòng" });
      }
      
      res.json({ 
        message: "Hủy đặt phòng thành công",
        refundAmount: refundAmount,
        refundPercentage: refundPercentage,
        originalAmount: parseFloat(booking.totalPrice)
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", authenticateToken, async (req: Request, res: Response) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

    try {
      const { amount, bookingId } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "vnd",
        metadata: {
          bookingId: bookingId.toString(),
        },
      });
      
      // Update booking with payment intent ID
      if (bookingId) {
        await storage.updateBooking(bookingId, {
          paymentIntentId: paymentIntent.id,
        });
      }
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  app.post("/api/confirm-payment", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { bookingId } = req.body;
      
      // Update booking status to confirmed
      const booking = await storage.updateBooking(bookingId, {
        status: "confirmed",
      });
      
      if (!booking) {
        return res.status(404).json({ message: "Không tìm thấy đặt phòng" });
      }
      
      res.json({ message: "Thanh toán thành công", booking });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // User routes
  app.put("/api/users/profile", authenticateToken, async (req: any, res: Response) => {
    try {
      const user = await storage.updateUser(req.user.id, req.body);
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const rooms = await storage.getRooms();
      const bookings = await storage.getBookings();
      
      const totalRooms = rooms.length;
      const totalBookings = bookings.length;
      
      // Count unique customers who have made bookings
      const uniqueCustomerIds = new Set(bookings.map(b => b.user.id));
      const totalCustomers = uniqueCustomerIds.size;
      
      // Calculate occupancy based on confirmed bookings
      const confirmedBookings = bookings.filter(b => b.status === "confirmed");
      const occupancyRate = totalRooms > 0 ? (confirmedBookings.length / totalRooms) * 100 : 0;
      
      // Calculate total revenue from confirmed and completed bookings
      const totalRevenue = bookings
        .filter(b => b.status === "confirmed" || b.status === "completed")
        .reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);
      
      res.json({
        totalRooms,
        totalBookings,
        occupancyRate: Math.round(occupancyRate),
        totalCustomers,
        totalRevenue,
        recentBookings: bookings
          .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
          .slice(0, 5),
      });
    } catch (error: any) {
      console.error("Error getting admin stats:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // AI Recommendations (simple implementation)
  // Services routes
  app.get("/api/services", async (req: Request, res: Response) => {
    try {
      const allServices = await storage.getServices();
      res.json(allServices);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ error: "Failed to fetch services" });
    }
  });

  app.post("/api/services", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const service = await storage.createService(req.body);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ error: "Failed to create service" });
    }
  });

  app.put("/api/services/:id", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.id);
      const service = await storage.updateService(serviceId, req.body);
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ error: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.id);
      const success = await storage.deleteService(serviceId);
      if (!success) {
        return res.status(404).json({ error: "Service not found" });
      }
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ error: "Failed to delete service" });
    }
  });

  app.get("/api/recommendations", authenticateToken, async (req: any, res: Response) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "Không tìm thấy người dùng" });
      }
      
      const rooms = await storage.getRooms();
      let recommendations = [];
      
      // Simple AI recommendation based on preferences
      if (user.preferences && user.preferences.length > 0) {
        recommendations = rooms.filter(room => {
          const roomAmenities = room.amenities.join(' ').toLowerCase();
          const roomDescription = (room.description || '').toLowerCase();
          const roomType = room.type.toLowerCase();
          
          return user.preferences.some(pref => {
            const prefLower = pref.toLowerCase();
            return roomAmenities.includes(prefLower) || 
                   roomDescription.includes(prefLower) ||
                   (prefLower.includes('sang trọng') && (roomType.includes('suite') || roomType.includes('presidential'))) ||
                   (prefLower.includes('biển') && roomAmenities.includes('ocean'));
          });
        });
      }
      
      // If no preference-based recommendations, suggest higher-tier rooms
      if (recommendations.length === 0) {
        recommendations = rooms.filter(room => room.type === 'suite' || room.type === 'deluxe');
      }
      
      res.json(recommendations.slice(0, 3));
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Chat routes
  app.get("/api/chat/messages", authenticateToken, async (req: any, res: Response) => {
    try {
      const { userId: targetUserId } = req.query;
      
      // If admin is requesting messages for a specific user
      if (req.user.role === 'admin' && targetUserId) {
        const messages = await storage.getChatMessages(parseInt(targetUserId as string));
        res.json(messages);
      } else {
        // Regular user getting their own messages
        const messages = await storage.getChatMessages(req.user.id);
        res.json(messages);
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/chat/messages", authenticateToken, async (req: any, res: Response) => {
    try {
      const { message, targetUserId } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Nội dung tin nhắn không được trống" });
      }

      const isFromAdmin = req.user.role === 'admin';
      const userId = isFromAdmin && targetUserId ? targetUserId : req.user.id;

      const chatMessage = await storage.createChatMessage({
        userId,
        message,
        isFromAdmin
      });

      res.json(chatMessage);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/chat/messages/read", authenticateToken, async (req: any, res: Response) => {
    try {
      const { isFromAdmin } = req.body;
      const success = await storage.markMessagesAsRead(req.user.id, isFromAdmin);
      res.json({ success });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin chat routes - get all user conversations
  app.get("/api/admin/chat/conversations", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get all users who have sent messages with their latest message
      const allMessages = await db.select({
        userId: chatMessages.userId,
        userName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
        message: chatMessages.message,
        createdAt: chatMessages.createdAt,
        isFromAdmin: chatMessages.isFromAdmin
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.userId, users.id))
      .orderBy(desc(chatMessages.createdAt));

      // Group by user and get latest message for each user
      const userConversations = new Map();
      
      for (const msg of allMessages) {
        if (!userConversations.has(msg.userId)) {
          userConversations.set(msg.userId, {
            userId: msg.userId,
            userName: msg.userName,
            userLastName: msg.userLastName,
            userEmail: msg.userEmail,
            lastMessage: msg.message,
            lastMessageTime: msg.createdAt,
            unreadCount: 0 // We can implement this later
          });
        }
      }

      const result = Array.from(userConversations.values())
        .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

      res.json(result);
    } catch (error: any) {
      console.error("Chat conversations error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Export reports endpoint for admin
  app.get("/api/admin/export/:type", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      const { format = 'csv', startDate, endDate } = req.query;

      let data: any[] = [];
      let filename = '';
      let headers: string[] = [];

      switch (type) {
        case 'bookings':
          const bookings = await storage.getBookings();
          data = bookings.map(booking => ({
            'Mã đặt phòng': booking.id,
            'Khách hàng': `${booking.user.firstName} ${booking.user.lastName}`,
            'Email': booking.user.email,
            'Số điện thoại': booking.user.phone || '',
            'Số phòng': booking.room.number,
            'Loại phòng': booking.room.type,
            'Ngày nhận': booking.checkIn,
            'Ngày trả': booking.checkOut,
            'Số khách': booking.guests,
            'Tổng tiền': booking.totalPrice,
            'Trạng thái': booking.status,
            'Phương thức TT': booking.paymentMethod || '',
            'Ngày tạo': booking.createdAt
          }));
          filename = `bookings_${new Date().toISOString().split('T')[0]}`;
          headers = Object.keys(data[0] || {});
          break;

        case 'rooms':
          const rooms = await storage.getRooms();
          data = rooms.map(room => ({
            'ID': room.id,
            'Số phòng': room.number,
            'Loại phòng': room.type,
            'Giá': room.price,
            'Sức chứa': room.capacity,
            'Trạng thái': room.isAvailable ? 'Có sẵn' : 'Đã đặt',
            'Mô tả': room.description || '',
            'Tiện nghi': room.amenities?.join(', ') || '',
            'Ngày tạo': room.createdAt
          }));
          filename = `rooms_${new Date().toISOString().split('T')[0]}`;
          headers = Object.keys(data[0] || {});
          break;

        case 'revenue':
          const allBookings = await storage.getBookings();
          const revenueData = allBookings
            .filter(b => b.status === 'confirmed')
            .reduce((acc: any, booking) => {
              const month = new Date(booking.createdAt).toISOString().slice(0, 7);
              if (!acc[month]) {
                acc[month] = {
                  month,
                  totalBookings: 0,
                  totalRevenue: 0,
                  averageBookingValue: 0
                };
              }
              acc[month].totalBookings += 1;
              acc[month].totalRevenue += parseFloat(booking.totalPrice);
              return acc;
            }, {});

          data = Object.values(revenueData).map((item: any) => ({
            'Tháng': item.month,
            'Số booking': item.totalBookings,
            'Doanh thu': item.totalRevenue,
            'Giá trị TB/booking': Math.round(item.totalRevenue / item.totalBookings)
          }));
          filename = `revenue_${new Date().toISOString().split('T')[0]}`;
          headers = Object.keys(data[0] || {});
          break;

        default:
          return res.status(400).json({ message: 'Invalid report type' });
      }

      if (format === 'csv') {
        // Generate CSV
        const csvContent = [
          headers.join(','),
          ...data.map(row => 
            headers.map(header => {
              const value = row[header];
              return typeof value === 'string' && value.includes(',') 
                ? `"${value}"` 
                : value;
            }).join(',')
          )
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        res.send('\ufeff' + csvContent); // Add BOM for Excel compatibility
      } else {
        // Return JSON
        res.json({
          type,
          data,
          filename,
          generatedAt: new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Lỗi xuất báo cáo: " + error.message });
    }
  });

  // Blog posts API
  app.get("/api/blog", async (req: Request, res: Response) => {
    try {
      const posts = await storage.getBlogPosts();
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ message: "Lỗi lấy danh sách bài viết: " + error.message });
    }
  });

  app.get("/api/blog/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getBlogPost(id);
      if (!post) {
        return res.status(404).json({ message: "Không tìm thấy bài viết" });
      }
      res.json(post);
    } catch (error: any) {
      res.status(500).json({ message: "Lỗi lấy bài viết: " + error.message });
    }
  });

  app.post("/api/blog", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const data = req.body;
      // Auto-generate slug from title if not provided
      if (!data.slug && data.title) {
        data.slug = data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      const validatedData = insertBlogPostSchema.parse(data);
      const post = await storage.createBlogPost(validatedData);
      res.status(201).json(post);
    } catch (error: any) {
      res.status(400).json({ message: "Lỗi tạo bài viết: " + error.message });
    }
  });

  app.put("/api/blog/:id", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const post = await storage.updateBlogPost(id, updates);
      if (!post) {
        return res.status(404).json({ message: "Không tìm thấy bài viết" });
      }
      res.json(post);
    } catch (error: any) {
      res.status(400).json({ message: "Lỗi cập nhật bài viết: " + error.message });
    }
  });

  app.delete("/api/blog/:id", authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteBlogPost(id);
      if (!success) {
        return res.status(404).json({ message: "Không tìm thấy bài viết" });
      }
      res.json({ message: "Xóa bài viết thành công" });
    } catch (error: any) {
      res.status(500).json({ message: "Lỗi xóa bài viết: " + error.message });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server cho thông báo admin
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'admin_connect') {
          adminClients.push(ws);
          console.log('Admin connected to WebSocket');
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      adminClients = adminClients.filter(client => client !== ws);
      console.log('WebSocket client disconnected');
    });
  });
  
  return httpServer;
}
