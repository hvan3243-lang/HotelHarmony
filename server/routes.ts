import bcrypt from "bcrypt";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { Express, Request, Response } from "express";
import session from "express-session";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import Stripe from "stripe";
import { WebSocket, WebSocketServer } from "ws";
import {
  chatMessages,
  insertBlogPostSchema,
  insertBookingSchema,
  insertRoomSchema,
  insertUserSchema,
  users,
} from "../shared/schema";
import { db } from "./db";
import { sendBookingConfirmation } from "./services/sendgrid";
import { storage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ||
  "http://localhost:5000/api/auth/google/callback";

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn(
    "⚠ Google OAuth: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured - Google login will be disabled"
  );
}

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Missing required Stripe secret: STRIPE_SECRET_KEY");
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-06-30.basil",
    })
  : null;

// Auth middleware
const authenticateToken = (req: any, res: Response, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("No token provided");
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.log("JWT verification failed:", err.message);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

const requireAdmin = (req: any, res: Response, next: any) => {
  if (req.user.role !== "admin") {
    return res.sendStatus(403);
  }
  next();
};

// WebSocket connections để thông báo admin
let adminClients: WebSocket[] = [];
let allClients: WebSocket[] = [];

// Function để gửi thông báo cho admin
const notifyAdmin = (message: any) => {
  adminClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

// Function để gửi thông báo cho tất cả client
const broadcastToClients = (message: any) => {
  allClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

// Thêm hàm tiện ích ở đầu file
function safeToISOString(value: any) {
  if (!value) return null;
  let date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return null; // Nếu không phải ngày hợp lệ
  return date.toISOString();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(
    session({
      secret: JWT_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: any, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if user exists with Google email
            let user = await storage.getUserByEmail(
              profile.emails?.[0]?.value || ""
            );

            if (!user) {
              // Create new user from Google profile
              const userData = {
                email: profile.emails?.[0]?.value || "",
                password: "", // No password for Google users
                firstName: profile.name?.givenName || "",
                lastName: profile.name?.familyName || "",
                phone: null,
                role: "customer" as const,
                preferences: [],
                isVip: false,
              };

              user = await storage.createUser(userData);
            }

            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
  }

  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      console.log("Register body:", req.body); // Thêm log debug
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
        { expiresIn: "24h" }
      );

      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      console.log("Login request body:", req.body);
      const { email, password } = req.body;

      if (!email || !password) {
        console.log("Missing email or password");
        return res
          .status(400)
          .json({ message: "Email và mật khẩu là bắt buộc" });
      }

      const user = await storage.getUserByEmail(email);
      console.log("User found:", user ? "Yes" : "No");

      if (!user) {
        return res
          .status(401)
          .json({ message: "Email hoặc mật khẩu không đúng" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      console.log("Password valid:", validPassword);

      if (!validPassword) {
        return res
          .status(401)
          .json({ message: "Email hoặc mật khẩu không đúng" });
      }

      const { password: _, ...userWithoutPassword } = user;

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({ user: userWithoutPassword, token });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Google OAuth routes
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    app.get(
      "/api/auth/google",
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/login" }),
      async (req: any, res: Response) => {
        try {
          const user = req.user;

          // Generate JWT token for consistency with regular login
          const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: "24h" }
          );

          // Store token in frontend (you can redirect with token as query param)
          res.redirect(
            `/?token=${token}&user=${encodeURIComponent(
              JSON.stringify({
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
              })
            )}`
          );
        } catch (error) {
          console.error("Google OAuth callback error:", error);
          res.redirect("/login?error=oauth_error");
        }
      }
    );
  }

  app.get(
    "/api/auth/me",
    authenticateToken,
    async (req: any, res: Response) => {
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
    }
  );

  // Room routes
  app.get("/api/rooms", async (req: Request, res: Response) => {
    try {
      const { checkIn, checkOut } = req.query;

      let rooms;
      if (checkIn && checkOut) {
        rooms = await storage.getAvailableRooms(
          new Date(checkIn as string),
          new Date(checkOut as string)
        );
      } else {
        rooms = await storage.getRooms();
      }
      // Bọc lại các trường ngày tháng
      const roomsSafe = rooms.map((r: any) => ({
        ...r,
        createdAt: safeToISOString(r.createdAt),
      }));
      res.json(roomsSafe);
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
  app.post(
    "/api/rooms/check-availability",
    async (req: Request, res: Response) => {
      try {
        const { checkIn, checkOut, room_id } = req.body;

        if (!checkIn || !checkOut) {
          return res
            .status(400)
            .json({ message: "Vui lòng cung cấp ngày nhận và trả phòng" });
        }

        const availableRooms = await storage.getAvailableRooms(
          new Date(checkIn),
          new Date(checkOut)
        );

        const isAvailable = room_id
          ? availableRooms.some((room) => room.id === parseInt(room_id))
          : availableRooms.length > 0;

        res.json({
          isAvailable,
          availableRooms: room_id ? [] : availableRooms,
          message: isAvailable
            ? "Phòng có sẵn cho thời gian này"
            : "Phòng không có sẵn cho thời gian được chọn",
        });
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    }
  );

  app.post(
    "/api/rooms",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const roomData = insertRoomSchema.parse(req.body);
        const room = await storage.createRoom(roomData);
        res.json(room);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    }
  );

  app.put(
    "/api/rooms/:id",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const room = await storage.updateRoom(
          parseInt(req.params.id),
          req.body
        );
        if (!room) {
          return res.status(404).json({ message: "Không tìm thấy phòng" });
        }
        res.json(room);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    }
  );

  app.delete(
    "/api/rooms/:id",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const success = await storage.deleteRoom(parseInt(req.params.id));
        if (!success) {
          return res.status(404).json({ message: "Không tìm thấy phòng" });
        }
        res.json({ message: "Xóa phòng thành công" });
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    }
  );

  // Booking routes
  app.get(
    "/api/bookings",
    authenticateToken,
    async (req: any, res: Response) => {
      // Force browser không cache
      res.set({
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        ETag: false, // Disable ETag
      });

      console.log("Debug - API /api/bookings called");
      console.log("Debug - Request user:", req.user);
      try {
        let bookings;
        console.log(
          "Debug - GET /api/bookings - User ID:",
          req.user.id,
          "Role:",
          req.user.role
        );
        if (req.user.role === "admin") {
          bookings = await storage.getBookings();
          console.log("Debug - Admin: Got all bookings");
        } else {
          bookings = await storage.getUserBookings(req.user.id);
          console.log(
            "Debug - Customer: Got user bookings for user",
            req.user.id
          );
        }
        console.log(
          "Debug - GET /api/bookings - Found bookings:",
          bookings.length
        );
        console.log("Debug - Bookings data:", bookings);

        // Debug: Kiểm tra tất cả bookings trong database
        const allBookings = await storage.getBookings();
        console.log("Debug - All bookings in database:", allBookings.length);
        console.log("Debug - All bookings data:", allBookings);

        // Debug: Kiểm tra bookings với user_id NULL
        const nullUserBookings = allBookings.filter(
          (b) => !b.user || !b.user.id
        );
        console.log(
          "Debug - Bookings with NULL user_id:",
          nullUserBookings.length
        );
        console.log("Debug - NULL user bookings:", nullUserBookings);

        // Bọc lại các trường ngày tháng và chuyển đổi field names
        const bookingsSafe = bookings.map((b: any) => ({
          ...b,
          checkIn: safeToISOString(b.check_in),
          checkOut: safeToISOString(b.check_out),
          totalPrice: b.total_price,
          depositAmount: b.deposit_amount,
          remainingAmount: b.remaining_amount,
          createdAt: safeToISOString(b.created_at),
          room:
            b.room && b.room.created_at
              ? { ...b.room, createdAt: safeToISOString(b.room.created_at) }
              : b.room,
          user:
            b.user && b.user.created_at
              ? { ...b.user, createdAt: safeToISOString(b.user.created_at) }
              : b.user,
        }));
        res.json(bookingsSafe);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    }
  );

  // API kiểm tra phòng trống
  app.post(
    "/api/check-room-availability",
    authenticateToken,
    async (req: any, res: Response) => {
      try {
        const { roomId, checkIn, checkOut } = req.body;

        console.log("Debug - Check room availability:", {
          roomId,
          checkIn,
          checkOut,
        });

        // Validate dates before creating Date objects
        if (!checkIn || !checkOut) {
          return res.status(400).json({
            message: "Missing check-in or check-out dates",
          });
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
          return res.status(400).json({
            message: "Invalid check-in or check-out dates",
          });
        }

        const availableRooms = await storage.getAvailableRooms(
          checkInDate,
          checkOutDate
        );

        const isAvailable = availableRooms.find((room) => room.id === roomId);

        console.log("Debug - Room availability result:", {
          roomId,
          isAvailable: !!isAvailable,
          availableRooms: availableRooms.map((r) => r.id),
        });

        res.json({
          available: !!isAvailable,
          message: isAvailable
            ? "Phòng có sẵn cho thời gian này"
            : "Phòng không có sẵn cho thời gian này",
        });
      } catch (error: any) {
        console.error("Error checking room availability:", error);
        res.status(400).json({ message: error.message });
      }
    }
  );

  app.post(
    "/api/bookings",
    authenticateToken,
    async (req: any, res: Response) => {
      try {
        console.log("=== DEBUG BOOKING CREATION ===");
        console.log("Booking body:", req.body);
        console.log("User from token:", req.user);
        console.log("User ID:", req.user.id);

        const bookingData = insertBookingSchema.parse({
          ...req.body,
          userId: req.user.id, // Đảm bảo đúng tên trường và kiểu số
        });
        console.log("Booking data after parse:", bookingData);
        console.log("=== END DEBUG ===");
        // Check room availability
        console.log("Debug - Checking room availability for:", {
          roomId: bookingData.roomId,
          checkIn: bookingData.checkIn,
          checkOut: bookingData.checkOut,
        });

        // Validate dates before creating Date objects
        const checkInDate = new Date(bookingData.checkIn);
        const checkOutDate = new Date(bookingData.checkOut);

        if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
          return res.status(400).json({
            message: "Invalid check-in or check-out dates",
          });
        }

        const availableRooms = await storage.getAvailableRooms(
          checkInDate,
          checkOutDate
        );

        console.log(
          "Debug - Available rooms:",
          availableRooms.map((r) => r.id)
        );
        console.log("Debug - Requested room ID:", bookingData.roomId);
        console.log(
          "Debug - Room found in available:",
          availableRooms.find((room) => room.id === bookingData.roomId)
        );

        if (!availableRooms.find((room) => room.id === bookingData.roomId)) {
          console.log("Debug - Room not available, returning error");
          return res.status(400).json({
            message:
              "Phòng này đã được đặt cho thời gian bạn chọn. Vui lòng chọn phòng khác hoặc thời gian khác.",
            code: "ROOM_NOT_AVAILABLE",
          });
        }
        const booking = await storage.createBooking(bookingData);
        console.log("Debug - Created booking:", booking);
        console.log("Debug - Booking ID:", booking.id);

        const bookingWithDetails = await storage.getBooking(booking.id);
        console.log("Debug - Booking with details:", bookingWithDetails);

        // Debug: Kiểm tra booking có được lưu không
        const allBookingsAfter = await storage.getBookings();
        console.log(
          "Debug - All bookings after create:",
          allBookingsAfter.length
        );

        // Debug: Kiểm tra booking có trong database không
        if (allBookingsAfter.length === 0) {
          console.log("Debug - WARNING: Booking not saved to database!");
          console.log(
            "Debug - Booking data that should be saved:",
            bookingData
          );
        }

        // Thông báo admin về booking mới
        if (bookingWithDetails) {
          console.log("BookingWithDetails:", bookingWithDetails); // Log bookingWithDetails
          notifyAdmin({
            type: "new_booking",
            data: {
              id: bookingWithDetails.id,
              customerName: `${req.user.firstName} ${req.user.lastName}`,
              room: `${bookingWithDetails.room.type} - Phòng ${bookingWithDetails.room.number}`,
              checkIn: safeToISOString(bookingWithDetails.checkIn),
              checkOut: safeToISOString(bookingWithDetails.checkOut),
              totalPrice: bookingWithDetails.totalPrice,
              timestamp: new Date().toISOString(),
            },
          });
        }
        // Send confirmation email (bỏ qua lỗi email)
        if (bookingWithDetails) {
          try {
            await sendBookingConfirmation(
              req.user.email,
              bookingWithDetails,
              bookingWithDetails.room,
              bookingWithDetails.user
            );
          } catch (emailError) {
            console.log("Email error (ignored):", emailError.message);
            // Bỏ qua lỗi email, vẫn trả về booking thành công
          }
        }
        res.json(booking);
      } catch (error: any) {
        console.error("Booking error:", error); // Log toàn bộ lỗi
        res.status(400).json({ message: error.message });
      }
    }
  );

  app.put(
    "/api/bookings/:id",
    authenticateToken,
    async (req: any, res: Response) => {
      try {
        const bookingId = parseInt(req.params.id);
        const booking = await storage.getBooking(bookingId);

        if (!booking) {
          return res.status(404).json({ message: "Không tìm thấy đặt phòng" });
        }

        // Check if user has permission to update this booking
        if (booking.user_id !== req.user.id && req.user.role !== "admin") {
          return res
            .status(403)
            .json({ message: "Không có quyền cập nhật đặt phòng này" });
        }

        const updates = req.body;
        const updatedBooking = await storage.updateBooking(bookingId, updates);

        if (updatedBooking) {
          res.json(updatedBooking);
        } else {
          res.status(400).json({ message: "Không thể cập nhật đặt phòng" });
        }
      } catch (error: any) {
        console.error("Error updating booking:", error);
        res.status(400).json({ message: error.message });
      }
    }
  );

  app.put(
    "/api/bookings/:id/cancel",
    authenticateToken,
    async (req: any, res: Response) => {
      try {
        const booking = await storage.getBooking(parseInt(req.params.id));
        if (!booking) {
          return res.status(404).json({ message: "Không tìm thấy đặt phòng" });
        }

        // Debug: Kiểm tra user ID matching
        console.log("Debug - Cancel booking check:");
        console.log(
          "  - booking.userId:",
          booking.userId,
          "type:",
          typeof booking.userId
        );
        console.log(
          "  - req.user.id:",
          req.user.id,
          "type:",
          typeof req.user.id
        );
        console.log("  - req.user.role:", req.user.role);
        console.log(
          "  - booking.user_id:",
          booking.user_id,
          "type:",
          typeof booking.user_id
        );

        // Only allow user to cancel their own booking or admin
        if (booking.user_id !== req.user.id && req.user.role !== "admin") {
          return res
            .status(403)
            .json({ message: "Không có quyền hủy đặt phòng này" });
        }

        // Check if booking can be cancelled based on check-in date
        const checkInDate = new Date(booking.checkIn);
        const now = new Date();
        const hoursUntilCheckIn =
          (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

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
          originalAmount: parseFloat(booking.totalPrice),
        });
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    }
  );

  app.put(
    "/api/bookings/:id/confirm",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const bookingId = parseInt(req.params.id);
        const booking = await storage.getBooking(bookingId);

        if (!booking) {
          return res.status(404).json({ message: "Không tìm thấy đặt phòng" });
        }

        // Update booking status to confirmed
        const newStatus =
          booking.status === "pending" ? "deposit_paid" : "confirmed";
        const updatedBooking = await storage.updateBooking(bookingId, {
          status: newStatus,
        });

        if (!updatedBooking) {
          return res
            .status(500)
            .json({ message: "Không thể cập nhật trạng thái đặt phòng" });
        }

        res.json({
          message: "Xác nhận đặt phòng thành công",
          booking: updatedBooking,
        });
      } catch (error: any) {
        res
          .status(400)
          .json({ message: "Lỗi xác nhận đặt phòng: " + error.message });
      }
    }
  );

  app.delete(
    "/api/bookings/:id",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const bookingId = parseInt(req.params.id);
        const booking = await storage.getBooking(bookingId);

        if (!booking) {
          return res.status(404).json({ message: "Không tìm thấy đặt phòng" });
        }

        const deleted = await storage.cancelBooking(bookingId);

        if (!deleted) {
          return res.status(500).json({ message: "Không thể xóa đặt phòng" });
        }

        res.json({
          message: "Xóa đặt phòng thành công",
          success: true,
        });
      } catch (error: any) {
        res
          .status(400)
          .json({ message: "Lỗi xóa đặt phòng: " + error.message });
      }
    }
  );

  // Stripe payment routes
  app.post(
    "/api/create-payment-intent",
    authenticateToken,
    async (req: Request, res: Response) => {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      try {
        const { amount, bookingId, isDeposit } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "vnd",
          metadata: {
            bookingId: bookingId.toString(),
            isDeposit: isDeposit ? "true" : "false",
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
        res
          .status(500)
          .json({ message: "Error creating payment intent: " + error.message });
      }
    }
  );

  app.post(
    "/api/confirm-payment",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        console.log("Debug - Confirm payment request body:", req.body);
        console.log("Debug - Confirm payment user:", req.user);

        const { bookingId, paymentMethod, isDeposit, paymentIntentId } =
          req.body;

        console.log("Debug - Confirm payment parsed data:", {
          bookingId,
          paymentMethod,
          isDeposit,
          paymentIntentId,
        });

        // Determine payment status based on whether it's a deposit or full payment
        const paymentStatus = isDeposit ? "deposit_paid" : "confirmed";

        // Get the booking to calculate amounts
        const currentBooking = await storage.getBooking(bookingId);
        if (!currentBooking) {
          return res.status(404).json({ message: "Không tìm thấy đặt phòng" });
        }

        const totalPrice = parseFloat(currentBooking.total_price || "0");
        const depositAmount = isDeposit
          ? parseFloat(req.body.amount || "0")
          : 0;
        const remainingAmount = totalPrice - depositAmount;

        // Update booking status and amounts
        const updateData: any = {
          status: paymentStatus,
          paymentMethod: paymentMethod,
          deposit_amount: depositAmount,
          remaining_amount: remainingAmount,
        };

        if (paymentIntentId) {
          updateData.paymentIntentId = paymentIntentId;
        }

        console.log("Debug - Confirm payment update data:", updateData);

        const booking = await storage.updateBooking(bookingId, updateData);

        console.log("Debug - Confirm payment updated booking:", booking);

        if (!booking) {
          return res.status(404).json({ message: "Không tìm thấy đặt phòng" });
        }

        const message = isDeposit
          ? "Đặt cọc thành công! Vui lòng thanh toán 70% còn lại khi check-in."
          : "Thanh toán thành công!";

        res.json({ message, booking });
      } catch (error: any) {
        console.error("Debug - Confirm payment error:", error);
        res.status(400).json({ message: error.message });
      }
    }
  );

  // User routes
  app.put(
    "/api/users/profile",
    authenticateToken,
    async (req: any, res: Response) => {
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
    }
  );

  // Fix booking data for existing bookings
  app.post(
    "/api/fix-booking-data",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const { bookingId } = req.body;

        const booking = await storage.getBooking(bookingId);
        if (!booking) {
          return res.status(404).json({ message: "Không tìm thấy đặt phòng" });
        }

        // Nếu status là deposit_paid hoặc confirmed nhưng chưa có deposit_amount
        if (
          (booking.status === "deposit_paid" ||
            booking.status === "confirmed") &&
          !booking.deposit_amount
        ) {
          const totalPrice = parseFloat(booking.total_price || "0");
          const depositAmount = totalPrice * 0.3; // 30% deposit
          const remainingAmount = totalPrice - depositAmount;

          const updatedBooking = await storage.updateBooking(bookingId, {
            deposit_amount: depositAmount.toString(),
            remaining_amount: remainingAmount.toString(),
          });

          res.json({
            message: "Đã cập nhật dữ liệu đặt cọc",
            booking: updatedBooking,
          });
        } else {
          res.json({
            message: "Booking không cần cập nhật",
            booking: booking,
          });
        }
      } catch (error: any) {
        console.error("Debug - Fix booking data error:", error);
        res.status(400).json({ message: error.message });
      }
    }
  );

  // Admin routes
  app.get(
    "/api/admin/stats",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const rooms = await storage.getRooms();
        const bookings = await storage.getBookings();

        const totalRooms = rooms.length;
        const totalBookings = bookings.length;

        // Count unique customers who have made bookings
        const uniqueCustomerIds = new Set(bookings.map((b) => b.user.id));
        const totalCustomers = uniqueCustomerIds.size;

        // Calculate occupancy based on confirmed bookings
        const confirmedBookings = bookings.filter(
          (b) => b.status === "confirmed"
        );
        const occupancyRate =
          totalRooms > 0 ? (confirmedBookings.length / totalRooms) * 100 : 0;

        // Calculate total revenue from confirmed and completed bookings
        const totalRevenue = bookings
          .filter((b) => b.status === "confirmed" || b.status === "completed")
          .reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);

        res.json({
          totalRooms,
          totalBookings,
          occupancyRate: Math.round(occupancyRate),
          totalCustomers,
          totalRevenue,
          recentBookings: bookings
            .sort(
              (a, b) =>
                new Date(b.createdAt!).getTime() -
                new Date(a.createdAt!).getTime()
            )
            .slice(0, 5),
        });
      } catch (error: any) {
        console.error("Error getting admin stats:", error);
        res.status(400).json({ message: error.message });
      }
    }
  );

  // Get chart data for admin dashboard
  app.get(
    "/api/admin/chart-data",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const bookings = await storage.getBookings();
        const rooms = await storage.getRooms();

        // Calculate monthly revenue (last 6 months)
        const monthlyRevenue = [];
        const currentDate = new Date();
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - i,
            1
          );
          const monthName = monthDate.toLocaleDateString("vi-VN", {
            month: "short",
            year: "numeric",
          });

          const monthBookings = bookings.filter((booking) => {
            const bookingDate = new Date(booking.createdAt!);
            return (
              bookingDate.getMonth() === monthDate.getMonth() &&
              bookingDate.getFullYear() === monthDate.getFullYear() &&
              (booking.status === "confirmed" || booking.status === "completed")
            );
          });

          const revenue = monthBookings.reduce(
            (sum, booking) => sum + parseFloat(booking.totalPrice),
            0
          );
          monthlyRevenue.push({ month: monthName, revenue });
        }

        // Room type distribution
        const roomTypes = rooms.reduce((acc, room) => {
          acc[room.type] = (acc[room.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const roomDistribution = Object.entries(roomTypes).map(
          ([type, count]) => ({
            type,
            count,
          })
        );

        // Booking status distribution
        const statusCount = bookings.reduce((acc, booking) => {
          acc[booking.status] = (acc[booking.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const bookingStatus = Object.entries(statusCount).map(
          ([status, count]) => ({
            status,
            count,
          })
        );

        res.json({
          monthlyRevenue,
          roomDistribution,
          bookingStatus,
        });
      } catch (error: any) {
        console.error("Chart data error:", error);
        res.status(400).json({ message: error.message });
      }
    }
  );

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

  app.post(
    "/api/services",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const service = await storage.createService(req.body);
        res.status(201).json(service);
      } catch (error) {
        console.error("Error creating service:", error);
        res.status(500).json({ error: "Failed to create service" });
      }
    }
  );

  app.put(
    "/api/services/:id",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
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
    }
  );

  app.delete(
    "/api/services/:id",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
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
    }
  );

  app.get(
    "/api/recommendations",
    authenticateToken,
    async (req: any, res: Response) => {
      try {
        const user = await storage.getUser(req.user.id);
        if (!user) {
          return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        const rooms = await storage.getRooms();
        let recommendations = [];

        // Simple AI recommendation based on preferences
        let userPreferences = [];
        if (user.preferences) {
          if (Array.isArray(user.preferences)) {
            userPreferences = user.preferences;
          } else if (typeof user.preferences === "string") {
            try {
              userPreferences = JSON.parse(user.preferences);
            } catch {
              userPreferences = [];
            }
          }
        }

        if (userPreferences.length > 0) {
          recommendations = rooms.filter((room) => {
            let amenitiesArr = [];
            if (Array.isArray(room.amenities)) {
              amenitiesArr = room.amenities;
            } else if (typeof room.amenities === "string") {
              try {
                amenitiesArr = JSON.parse(room.amenities);
              } catch {
                amenitiesArr = [];
              }
            } else {
              amenitiesArr = [];
            }
            const roomAmenities = amenitiesArr.join(" ").toLowerCase();
            const roomDescription = (room.description || "").toLowerCase();
            const roomType = room.type.toLowerCase();

            return userPreferences.some((pref: any) => {
              const prefLower = pref.toLowerCase();
              return (
                roomAmenities.includes(prefLower) ||
                roomDescription.includes(prefLower) ||
                (prefLower.includes("sang trọng") &&
                  (roomType.includes("suite") ||
                    roomType.includes("presidential"))) ||
                (prefLower.includes("biển") && roomAmenities.includes("ocean"))
              );
            });
          });
        }

        // If no preference-based recommendations, suggest higher-tier rooms
        if (recommendations.length === 0) {
          recommendations = rooms.filter(
            (room) => room.type === "suite" || room.type === "deluxe"
          );
        }

        res.json(recommendations.slice(0, 3));
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    }
  );

  // Chat routes
  app.get(
    "/api/chat/messages",
    authenticateToken,
    async (req: any, res: Response) => {
      try {
        const { user_id: targetUserId } = req.query;

        // If admin is requesting messages for a specific user
        if (req.user.role === "admin" && targetUserId) {
          const messages = await storage.getChatMessages(
            parseInt(targetUserId as string)
          );
          res.json(messages);
        } else {
          // Regular user getting their own messages
          const messages = await storage.getChatMessages(req.user.id);
          res.json(messages);
        }
      } catch (error: any) {
        res.json([]); // Luôn trả về mảng rỗng khi lỗi
      }
    }
  );

  app.post(
    "/api/chat/messages",
    authenticateToken,
    async (req: any, res: Response) => {
      try {
        const { message, targetUserId } = req.body;
        if (!message) {
          return res
            .status(400)
            .json({ message: "Nội dung tin nhắn không được trống" });
        }

        console.log("=== DEBUG CHAT MESSAGE ===");
        console.log("req.user:", req.user);
        console.log("req.user.role:", req.user.role);
        console.log("req.user.role === 'admin':", req.user.role === "admin");

        const isFromAdmin = req.user.role === "admin";
        console.log("User sending message:", {
          userId: req.user.id,
          userRole: req.user.role,
          isFromAdmin: isFromAdmin,
          targetUserId: targetUserId,
        });

        // Khi admin gửi tin nhắn, user_id phải là targetUserId (khách hàng)
        // Khi khách hàng gửi tin nhắn, user_id là chính họ
        const user_id = isFromAdmin ? targetUserId : req.user.id;

        // Force set is_from_admin bằng raw SQL
        const insertData = {
          user_id,
          message,
          is_from_admin: isFromAdmin ? 1 : 0,
        };

        console.log("Insert data:", insertData);

        const chatMessage = await storage.createChatMessage(insertData);

        console.log("Chat message created:", chatMessage);

        // Lấy tin nhắn thực tế từ database
        const [actualMessage] = await db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.id, chatMessage.insertId));

        console.log("Actual message from DB:", actualMessage);

        // Send WebSocket notification for real-time updates
        broadcastToClients({
          type: "new_message",
          user_id,
          isFromAdmin,
          message: actualMessage,
        });

        res.json(actualMessage);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    }
  );

  app.put(
    "/api/chat/messages/read",
    authenticateToken,
    async (req: any, res: Response) => {
      try {
        const { isFromAdmin } = req.body;
        const success = await storage.markMessagesAsRead(
          req.user.id,
          isFromAdmin
        );
        res.json({ success });
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    }
  );

  // API để lấy trạng thái tin nhắn (đã đọc/chưa đọc)
  app.get(
    "/api/chat/messages/status/:user_id",
    authenticateToken,
    async (req: any, res: Response) => {
      try {
        console.log("🚀 API Status called with params:", req.params);
        console.log("🚀 User object:", req.user);

        const targetUserId = parseInt(req.params.user_id);
        const isFromAdmin = req.user.role === "admin";

        console.log("📊 Status request:", {
          targetUserId,
          isFromAdmin,
          userRole: req.user.role,
        });

        console.log("🔍 Query conditions:");
        console.log("- user_id =", targetUserId);
        console.log("- is_from_admin =", isFromAdmin ? 0 : 1);
        console.log("- is_read = 0");
        console.log(
          "🔍 Expected: Admin should count messages from user (is_from_admin: 0) that are unread"
        );

        // Logic Zalo: Đếm tin nhắn chưa đọc
        // Nếu admin đang request -> đếm tin nhắn từ user (is_from_admin: 0) chưa được admin xem
        // Nếu user đang request -> đếm tin nhắn từ admin (is_from_admin: 1) chưa được user xem
        const unreadMessages = await db
          .select({
            id: chatMessages.id,
            is_from_admin: chatMessages.is_from_admin,
            is_read: chatMessages.is_read,
          })
          .from(chatMessages)
          .where(
            and(
              eq(chatMessages.user_id, targetUserId),
              eq(chatMessages.is_from_admin, isFromAdmin ? 0 : 1), // User messages for admin, Admin messages for user
              eq(chatMessages.is_read, 0)
            )
          );

        // Debug: Check all messages for this user
        const allMessages = await db
          .select({
            id: chatMessages.id,
            user_id: chatMessages.user_id,
            message: chatMessages.message,
            is_from_admin: chatMessages.is_from_admin,
            is_read: chatMessages.is_read,
          })
          .from(chatMessages)
          .where(eq(chatMessages.user_id, targetUserId));

        console.log("📋 All messages for user:", allMessages);
        console.log("📋 Unread messages found:", unreadMessages);
        console.log("📊 Total unread count:", unreadMessages.length);

        // Debug: Check if there are any unread messages
        const unreadFromUser = allMessages.filter(
          (msg) => msg.is_from_admin === 0 && msg.is_read === 0
        );
        const unreadFromAdmin = allMessages.filter(
          (msg) => msg.is_from_admin === 1 && msg.is_read === 0
        );
        console.log("🔍 Unread from user:", unreadFromUser.length);
        console.log("🔍 Unread from admin:", unreadFromAdmin.length);

        res.json({
          unreadCount: unreadMessages.length,
          unreadMessages: unreadMessages,
          allMessages: allMessages, // Debug info
        });
      } catch (error: any) {
        console.error("❌ Status API error:", error);
        res.status(400).json({ message: error.message });
      }
    }
  );

  // Admin chat routes - get all user conversations
  app.get(
    "/api/admin/chat/conversations",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        // Lấy tất cả user_id đã từng gửi hoặc nhận tin nhắn
        const allUserIdsRaw = await db
          .select({ user_id: chatMessages.user_id })
          .from(chatMessages);
        // Lọc unique user_id bằng JS và loại bỏ null/undefined
        const userIds = Array.from(
          new Set((allUserIdsRaw || []).map((row) => row.user_id))
        ).filter((id): id is number => id !== null && id !== undefined);
        if (userIds.length === 0) {
          return res.json([]);
        }
        // Lấy message mới nhất cho mỗi user
        const allMessages = await db
          .select({
            user_id: chatMessages.user_id,
            message: chatMessages.message,
            created_at: chatMessages.created_at,
          })
          .from(chatMessages)
          .where(inArray(chatMessages.user_id, userIds))
          .orderBy(desc(chatMessages.created_at));
        // Group by user_id, lấy message mới nhất
        const userConversations = new Map();
        for (const msg of allMessages) {
          if (!userConversations.has(msg.user_id)) {
            userConversations.set(msg.user_id, {
              user_id: msg.user_id,
              lastMessage: msg.message,
              lastMessageTime: msg.created_at,
            });
          }
        }
        // Lấy thông tin user
        const usersList = await db
          .select({
            id: users.id,
            first_name: users.first_name,
            last_name: users.last_name,
            email: users.email,
          })
          .from(users)
          .where(inArray(users.id, userIds));
        // Merge thông tin user vào conversation
        const result = Array.from(userConversations.values()).map((conv) => {
          const user = usersList.find((u) => u.id === conv.user_id);
          return {
            ...conv,
            first_name: user?.first_name || "",
            last_name: user?.last_name || "",
            email: user?.email || "",
          };
        });
        res.json(result);
      } catch (error: any) {
        console.error("Chat conversations error:", error);
        res
          .status(400)
          .json({ message: error.message || "Chat conversations error" });
      }
    }
  );

  // API cho admin xóa/thu hồi tin nhắn
  app.delete(
    "/api/admin/chat/messages/:message_id",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const message_id = parseInt(req.params.message_id);
        const result = await db
          .delete(chatMessages)
          .where(eq(chatMessages.id, message_id));
        if ((result?.rowCount || result?.affectedRows || 0) > 0) {
          res.json({ success: true, message: "Đã xóa tin nhắn" });
        } else {
          res
            .status(404)
            .json({ success: false, message: "Không tìm thấy tin nhắn" });
        }
      } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
      }
    }
  );

  // Get chat messages for a specific user (admin only)
  app.get(
    "/api/admin/chat/messages/:user_id",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const user_id = parseInt(req.params.user_id);
        console.log("=== DEBUG CHAT MESSAGES ===");
        console.log("User ID:", user_id);

        const messages = await storage.getChatMessages(user_id);
        console.log("Raw messages from storage:", messages);

        // Log từng message để debug
        messages.forEach((msg, index) => {
          console.log(`Message ${index + 1}:`, {
            id: msg.id,
            message: msg.message,
            messageType: typeof msg.message,
            messageLength: msg.message?.length,
            is_from_admin: msg.is_from_admin,
            created_at: msg.created_at,
          });
        });

        res.json(messages);
      } catch (error: any) {
        console.error("Error getting chat messages:", error);
        res.status(500).json({ message: error.message });
      }
    }
  );

  // Export reports endpoint for admin
  app.get(
    "/api/admin/export/:type",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const { type } = req.params;
        const { format = "csv", startDate, endDate } = req.query;

        let data: any[] = [];
        let filename = "";
        let headers: string[] = [];

        switch (type) {
          case "bookings":
            const bookings = await storage.getBookings();
            data = bookings.map((booking) => ({
              "Mã đặt phòng": booking.id,
              "Khách hàng": `${booking.user.firstName} ${booking.user.lastName}`,
              Email: booking.user.email,
              "Số điện thoại": booking.user.phone || "",
              "Số phòng": booking.room.number,
              "Loại phòng": booking.room.type,
              "Ngày nhận": safeToISOString(booking.checkIn),
              "Ngày trả": safeToISOString(booking.checkOut),
              "Số khách": booking.guests,
              "Tổng tiền": booking.totalPrice,
              "Trạng thái": booking.status,
              "Phương thức TT": booking.paymentMethod || "",
              "Ngày tạo": safeToISOString(booking.createdAt),
            }));
            filename = `bookings_${new Date().toISOString().split("T")[0]}`;
            headers = Object.keys(data[0] || {});
            break;

          case "rooms":
            const rooms = await storage.getRooms();
            data = rooms.map((room) => ({
              ID: room.id,
              "Số phòng": room.number,
              "Loại phòng": room.type,
              Giá: room.price,
              "Sức chứa": room.capacity,
              "Trạng thái": room.isAvailable ? "Có sẵn" : "Đã đặt",
              "Mô tả": room.description || "",
              "Tiện nghi": room.amenities?.join(", ") || "",
              "Ngày tạo": safeToISOString(room.createdAt),
            }));
            filename = `rooms_${new Date().toISOString().split("T")[0]}`;
            headers = Object.keys(data[0] || {});
            break;

          case "revenue":
            const allBookings = await storage.getBookings();
            const revenueData = allBookings
              .filter((b) => b.status === "confirmed")
              .reduce((acc: any, booking) => {
                const month = safeToISOString(booking.createdAt).slice(0, 7);
                if (!acc[month]) {
                  acc[month] = {
                    month,
                    totalBookings: 0,
                    totalRevenue: 0,
                    averageBookingValue: 0,
                  };
                }
                acc[month].totalBookings += 1;
                acc[month].totalRevenue += parseFloat(booking.totalPrice);
                return acc;
              }, {});

            data = Object.values(revenueData).map((item: any) => ({
              Tháng: item.month,
              "Số booking": item.totalBookings,
              "Doanh thu": item.totalRevenue,
              "Giá trị TB/booking": Math.round(
                item.totalRevenue / item.totalBookings
              ),
            }));
            filename = `revenue_${new Date().toISOString().split("T")[0]}`;
            headers = Object.keys(data[0] || {});
            break;

          default:
            return res.status(400).json({ message: "Invalid report type" });
        }

        if (format === "csv") {
          // Generate CSV
          const csvContent = [
            headers.join(","),
            ...data.map((row) =>
              headers
                .map((header) => {
                  const value = row[header];
                  return typeof value === "string" && value.includes(",")
                    ? `"${value}"`
                    : value;
                })
                .join(",")
            ),
          ].join("\n");

          res.setHeader("Content-Type", "text/csv; charset=utf-8");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}.csv"`
          );
          res.send("\ufeff" + csvContent); // Add BOM for Excel compatibility
        } else {
          // Return JSON
          res.json({
            type,
            data,
            filename,
            generatedAt: new Date().toISOString(),
          });
        }
      } catch (error: any) {
        console.error("Export error:", error);
        res.status(500).json({ message: "Lỗi xuất báo cáo: " + error.message });
      }
    }
  );

  // Blog posts API
  app.get("/api/blog", async (req: Request, res: Response) => {
    try {
      const posts = await storage.getBlogPosts();
      res.json(posts);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Lỗi lấy danh sách bài viết: " + error.message });
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

  app.post(
    "/api/blog",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const data = req.body;
        // Auto-generate slug from title if not provided
        if (!data.slug && data.title) {
          data.slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        }
        const validatedData = insertBlogPostSchema.parse(data);
        const post = await storage.createBlogPost(validatedData);
        res.status(201).json(post);
      } catch (error: any) {
        res.status(400).json({ message: "Lỗi tạo bài viết: " + error.message });
      }
    }
  );

  app.put(
    "/api/blog/:id",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const updates = req.body;
        const post = await storage.updateBlogPost(id, updates);
        if (!post) {
          return res.status(404).json({ message: "Không tìm thấy bài viết" });
        }
        res.json(post);
      } catch (error: any) {
        res
          .status(400)
          .json({ message: "Lỗi cập nhật bài viết: " + error.message });
      }
    }
  );

  app.delete(
    "/api/blog/:id",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
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
    }
  );

  // Walk-in booking APIs
  app.get("/api/customers/check", async (req: Request, res: Response) => {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const customer = await storage.getUserByEmail(email as string);
      res.json({
        exists: !!customer,
        customer: customer || null,
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Lỗi kiểm tra khách hàng: " + error.message });
    }
  });

  app.post(
    "/api/customers/walkin",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        // Check if customer already exists
        const existingCustomer = await storage.getUserByEmail(req.body.email);
        if (existingCustomer) {
          const { password, ...customerWithoutPassword } = existingCustomer;
          return res.json(customerWithoutPassword);
        }

        const hashedPassword = await bcrypt.hash("123456", 10); // Default password
        const userData = insertUserSchema.parse({
          ...req.body,
          password: hashedPassword,
          role: "customer",
        });
        const user = await storage.createUser(userData);
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } catch (error: any) {
        res
          .status(400)
          .json({ message: "Lỗi tạo khách hàng: " + error.message });
      }
    }
  );

  app.post(
    "/api/bookings/walkin",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const {
          customerId,
          checkIn,
          checkOut,
          checkInTime,
          checkOutTime,
          ...bookingData
        } = req.body;

        const booking = await storage.createBooking({
          ...bookingData,
          userId: customerId,
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          checkInTime: checkInTime || "14:00",
          checkOutTime: checkOutTime || "12:00",
          status: "pending",
        });

        res.json(booking);
      } catch (error: any) {
        res
          .status(400)
          .json({ message: "Lỗi tạo đặt phòng: " + error.message });
      }
    }
  );

  app.post(
    "/api/walkin-payment",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const { bookingId, paymentMethod, paymentType, amount } = req.body;

        // Walk-in customers must pay full amount
        if (paymentType !== "full") {
          return res
            .status(400)
            .json({ message: "Khách đến trực tiếp cần thanh toán đầy đủ" });
        }

        const booking = await storage.updateBooking(bookingId, {
          status: "confirmed",
          paymentMethod,
        });

        if (!booking) {
          return res.status(404).json({ message: "Không tìm thấy đặt phòng" });
        }

        res.json({
          message: "Thanh toán đầy đủ thành công - Đặt phòng đã được xác nhận",
          booking,
        });
      } catch (error: any) {
        res
          .status(400)
          .json({ message: "Lỗi xử lý thanh toán: " + error.message });
      }
    }
  );

  app.post(
    "/api/checkin-payment",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const { bookingId, paymentMethod } = req.body;

        const booking = await storage.updateBooking(bookingId, {
          status: "confirmed",
          paymentMethod: paymentMethod,
        });

        if (!booking) {
          return res.status(404).json({ message: "Không tìm thấy đặt phòng" });
        }

        res.json({
          message: "Check-in thành công",
          booking,
        });
      } catch (error: any) {
        res.status(400).json({ message: "Lỗi check-in: " + error.message });
      }
    }
  );

  // Contact Messages API
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const contactData = req.body;
      const message = await storage.createContactMessage(contactData);
      res.json(message);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error creating contact message: " + error.message });
    }
  });

  app.get(
    "/api/admin/contact-messages",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const messages = await storage.getContactMessages();
        res.json(messages);
      } catch (error: any) {
        res.status(500).json({
          message: "Error fetching contact messages: " + error.message,
        });
      }
    }
  );

  app.get(
    "/api/admin/contact-messages/:id",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const message = await storage.getContactMessage(
          parseInt(req.params.id)
        );
        if (!message) {
          return res.status(404).json({ message: "Contact message not found" });
        }
        res.json(message);
      } catch (error: any) {
        res.status(500).json({
          message: "Error fetching contact message: " + error.message,
        });
      }
    }
  );

  app.post(
    "/api/admin/contact-messages/:id/respond",
    authenticateToken,
    requireAdmin,
    async (req: any, res: Response) => {
      try {
        const { response } = req.body;
        const messageId = parseInt(req.params.id);
        const adminId = req.user.id;

        const updatedMessage = await storage.respondToContactMessage(
          messageId,
          response,
          adminId
        );
        res.json(updatedMessage);
      } catch (error: any) {
        res.status(500).json({
          message: "Error responding to contact message: " + error.message,
        });
      }
    }
  );

  // Test API: Create unread message
  app.post(
    "/api/chat/messages/test",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const { message, targetUserId } = req.body;
        const currentUserId = (req as any).user?.id;
        const isFromAdmin = (req as any).user?.role === "admin";

        console.log("Creating test message:", {
          message,
          targetUserId,
          currentUserId,
          isFromAdmin,
        });

        // Create message with is_read = 0 (unread)
        const result = await db.insert(chatMessages).values({
          user_id: targetUserId,
          message: message,
          is_from_admin: isFromAdmin ? 1 : 0,
          is_read: 0, // Mark as unread
        });

        console.log("Test message created:", result);
        res.json({ success: true, message: "Test message created" });
      } catch (error: any) {
        console.error("Error creating test message:", error);
        res.status(500).json({
          success: false,
          message: "Error creating test message: " + error.message,
        });
      }
    }
  );

  // Mark chat messages as read
  app.put(
    "/api/chat/messages/read",
    authenticateToken,
    async (req: Request, res: Response) => {
      try {
        const { targetUserId } = req.body; // ID của người mà mình muốn đánh dấu tin nhắn đã đọc
        const currentUserId = (req as any).user?.id;
        const isFromAdmin = (req as any).user?.role === "admin";

        console.log("Mark as read request:", {
          targetUserId,
          currentUserId,
          isFromAdmin,
        });

        // Đánh dấu tin nhắn đã đọc theo logic Zalo
        // Nếu admin đang đánh dấu -> đánh dấu tin nhắn từ user (is_from_admin: 0)
        // Nếu user đang đánh dấu -> đánh dấu tin nhắn từ admin (is_from_admin: 1)
        const result = await db
          .update(chatMessages)
          .set({ is_read: 1 })
          .where(
            and(
              eq(chatMessages.user_id, targetUserId),
              eq(chatMessages.is_from_admin, isFromAdmin ? 0 : 1),
              eq(chatMessages.is_read, 0)
            )
          );

        console.log("Mark as read result:", result);
        console.log("Affected rows:", (result as any)?.affectedRows || 0);

        const affectedRows = (result as any)?.affectedRows || 0;
        res.json({
          success: affectedRows > 0,
          message:
            affectedRows > 0
              ? "Messages marked as read"
              : "No messages to mark as read",
          affectedRows,
        });
      } catch (error: any) {
        console.error("Error marking messages as read:", error);
        res.status(500).json({
          success: false,
          message: "Error marking messages as read: " + error.message,
        });
      }
    }
  );

  app.put(
    "/api/admin/contact-messages/:id/status",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const { status } = req.body;
        const messageId = parseInt(req.params.id);

        const updatedMessage = await storage.updateContactMessage(messageId, {
          status,
        });
        res.json(updatedMessage);
      } catch (error: any) {
        res.status(500).json({
          message: "Error updating contact message status: " + error.message,
        });
      }
    }
  );

  app.delete(
    "/api/admin/contact-messages/:id",
    authenticateToken,
    requireAdmin,
    async (req: Request, res: Response) => {
      try {
        const messageId = parseInt(req.params.id);

        const deleted = await storage.deleteContactMessage(messageId);

        if (!deleted) {
          return res.status(404).json({ error: "Message not found" });
        }

        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({
          message: "Error deleting contact message: " + error.message,
        });
      }
    }
  );

  const httpServer = createServer(app);

  // Review & Rating System Routes
  app.get("/api/reviews", async (req: Request, res: Response) => {
    try {
      const { room_id, user_id, limit } = req.query;
      const reviews = await storage.getReviews(
        room_id ? parseInt(room_id as string) : undefined,
        user_id ? parseInt(user_id as string) : undefined,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(reviews);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error fetching reviews: " + error.message });
    }
  });

  app.post(
    "/api/reviews",
    authenticateToken,
    async (req: any, res: Response) => {
      try {
        const reviewData = {
          ...req.body,
          user_id: req.user.id,
        };

        // Verify that user has completed this booking
        const booking = await storage.getBooking(reviewData.bookingId);
        if (
          !booking ||
          booking.userId !== req.user.id ||
          booking.status !== "completed"
        ) {
          return res.status(400).json({
            message:
              "Bạn chỉ có thể đánh giá phòng sau khi hoàn thành lưu trú.",
            code: "BOOKING_NOT_COMPLETED",
          });
        }

        const review = await storage.createReview(reviewData);
        res.json(review);
      } catch (error: any) {
        res
          .status(500)
          .json({ message: "Error creating review: " + error.message });
      }
    }
  );

  app.get("/api/rooms/:id/rating", async (req: Request, res: Response) => {
    try {
      const room_id = parseInt(req.params.id);
      const rating = await storage.getRoomRating(room_id);
      res.json(rating);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error fetching room rating: " + error.message });
    }
  });

  // WebSocket server cho thông báo admin
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    console.log("WebSocket client connected");

    // Add to all clients list
    allClients.push(ws);

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "admin_connect") {
          adminClients.push(ws);
          console.log("Admin connected to WebSocket");
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      adminClients = adminClients.filter((client) => client !== ws);
      allClients = allClients.filter((client) => client !== ws);
      console.log("WebSocket client disconnected");
    });
  });

  // Gemini AI Proxy Route
  app.post("/api/gemini", async (req: Request, res: Response) => {
    try {
      const { question, userInfo } = req.body;
      if (!question) {
        return res.status(400).json({ message: "Missing question" });
      }
      const apiKey = "AIzaSyCHXjw2gTKYRfuJAyvLIpO_oVh4jQXytPI";
      // Đổi endpoint sang v1beta và model gemini-2.0-flash
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      // Lấy dữ liệu động
      const [rooms, services, blogs] = await Promise.all([
        storage.getRooms(),
        storage.getServices(),
        storage.getBlogPosts(),
      ]);
      // Thông tin liên hệ (có thể lấy từ config hoặc hardcode)
      const contact = {
        address: "123 Đường ABC, Quận 1, TP.HCM",
        phone: "+84 123 456 789",
        email: "info@hotellux.com",
      };
      // Ghép thông tin user vào đầu prompt nếu có
      const userInfoStr =
        userInfo && userInfo.name
          ? `Người dùng hiện tại: ${userInfo.name}${
              userInfo.email ? ` (email: ${userInfo.email})` : ""
            }\n`
          : "";
      // Hướng dẫn rõ ràng cho AI
      const INSTRUCTION = `Bạn là trợ lý AI cho website khách sạn. Dưới đây là dữ liệu khách sạn. Khi người dùng hỏi về tài khoản, hãy trả lời đúng tên tài khoản hiện tại nếu có. Khi người dùng hỏi về giá phòng, hãy trả lời đúng giá từ danh sách phòng. Nếu hỏi về dịch vụ, blog, liên hệ, hãy trả lời dựa trên dữ liệu bên dưới. Trả lời ngắn gọn, chính xác, thân thiện.`;
      // Format dữ liệu động ngắn gọn
      const roomList = rooms
        .map((r) => `Phòng ${r.number} (${r.type}, ${r.status}, ${r.price}đ)`)
        .join("; ");
      const serviceList = services
        .map((s) => `${s.name} (${s.description}, ${s.price}đ)`)
        .join("; ");
      const blogList = blogs.map((b) => b.title || b.name || b.slug).join("; ");
      const contactInfo = `Địa chỉ: ${contact.address}; Điện thoại: ${contact.phone}; Email: ${contact.email}`;
      // Ghép prompt tối ưu
      const prompt = `${userInfoStr}${INSTRUCTION}\n\nDỮ LIỆU KHÁCH SẠN:\n- Phòng: ${roomList}\n- Dịch vụ: ${serviceList}\n- Blog: ${blogList}\n- Liên hệ: ${contactInfo}\n\nCâu hỏi: ${question}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      });
      if (!response.ok) {
        const err = await response.text();
        return res
          .status(500)
          .json({ message: "Gemini API error", error: err });
      }
      const data = await response.json();
      // Lấy câu trả lời đầu tiên
      const answer =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Không nhận được phản hồi từ AI.";
      res.json({ answer });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Gemini proxy error", error: error.message });
    }
  });

  return httpServer;
}
