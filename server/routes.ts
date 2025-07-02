import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertUserSchema, insertRoomSchema, insertBookingSchema } from "@shared/schema";
import { sendBookingConfirmation } from "./services/sendgrid";

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
        return res.status(400).json({ message: "Phòng không còn trống trong thời gian này" });
      }
      
      const booking = await storage.createBooking(bookingData);
      const bookingWithDetails = await storage.getBooking(booking.id);
      
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
      
      const success = await storage.cancelBooking(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Không thể hủy đặt phòng" });
      }
      
      res.json({ message: "Hủy đặt phòng thành công" });
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
      const users = Array.from((storage as any).users.values());
      
      const totalRooms = rooms.length;
      const occupiedRooms = bookings.filter(b => b.status === "confirmed").length;
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
      const totalCustomers = users.filter((u: any) => u.role === "customer").length;
      const totalRevenue = bookings
        .filter(b => b.status === "confirmed" || b.status === "completed")
        .reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);
      
      res.json({
        totalRooms,
        occupancyRate: Math.round(occupancyRate),
        totalCustomers,
        totalRevenue,
        recentBookings: bookings.slice(0, 5),
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // AI Recommendations (simple implementation)
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

  const httpServer = createServer(app);
  return httpServer;
}
