import bcrypt from "bcrypt";
import { and, desc, eq, or, sql } from "drizzle-orm";
import {
  blogPosts,
  bookings,
  chatMessages,
  contactMessages,
  reviews,
  rooms,
  services,
  users,
} from "../shared/schema";
import { connection, db } from "./db";
import type {
  BlogPost,
  Booking,
  ChatMessage,
  InsertBlogPost,
  InsertBooking,
  InsertChatMessage,
  InsertRoom,
  InsertService,
  InsertUser,
  Room,
  Service,
  User,
} from "./types";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Room methods
  getRooms(): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  getRoomByNumber(number: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: number, updates: Partial<Room>): Promise<Room | undefined>;
  deleteRoom(id: number): Promise<boolean>;
  getAvailableRooms(checkIn: Date, checkOut: Date): Promise<Room[]>;

  // Booking methods
  getBookings(): Promise<(Booking & { user: User; room: Room })[]>;
  getBooking(
    id: number
  ): Promise<(Booking & { user: User; room: Room }) | undefined>;
  getUserBookings(userId: number): Promise<(Booking & { room: Room })[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(
    id: number,
    updates: Partial<Booking>
  ): Promise<Booking | undefined>;
  cancelBooking(id: number): Promise<boolean>;

  // Service methods
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(
    id: number,
    updates: Partial<Service>
  ): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;

  // Chat methods
  getChatMessages(userId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  markMessagesAsRead(userId: number, isFromAdmin?: boolean): Promise<boolean>;

  // Blog methods
  getBlogPosts(): Promise<BlogPost[]>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(
    id: number,
    updates: Partial<BlogPost>
  ): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;

  // Review methods
  getReviews(roomId?: number, userId?: number, limit?: number): Promise<any[]>;
  createReview(review: any): Promise<any>;
  getRoomRating(
    roomId: number
  ): Promise<{ averageRating: number; totalReviews: number }>;

  // Loyalty methods
  getLoyaltyData(userId: number): Promise<any>;
  getPointTransactions(userId: number): Promise<any[]>;
  updateLoyaltyPoints(
    userId: number,
    points: number,
    type: "earned" | "redeemed",
    description: string
  ): Promise<void>;

  // Promotional code methods
  getPromotionalCodes(): Promise<any[]>;
  getAvailablePromotionalCodes(userLevel?: string): Promise<any[]>;
  validatePromotionalCode(code: string, amount: number): Promise<any>;
  createPromotionalCode(code: any): Promise<any>;
  updatePromotionalCode(id: number, updates: any): Promise<any>;

  // Advanced search
  searchRooms(filters: any): Promise<any[]>;

  // Contact messages
  getContactMessages(): Promise<any[]>;
  getContactMessage(id: number): Promise<any>;
  createContactMessage(message: any): Promise<any>;
  updateContactMessage(id: number, updates: any): Promise<any>;
  respondToContactMessage(
    id: number,
    response: string,
    adminId: number
  ): Promise<any>;
  deleteContactMessage(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Seed data when the storage is initialized
    this.seedData();
  }

  private async seedData() {
    try {
      // Check if admin user exists
      const adminUser = await this.getUserByEmail("admin@hotellux.com");
      if (!adminUser) {
        console.log("Creating admin user...");
        await this.createUser({
          email: "admin@hotellux.com",
          password: "admin123",
          firstName: "Admin",
          lastName: "User",
          role: "admin",
        });
        console.log("Admin user created successfully");
      } else {
        console.log("Admin user already exists:", adminUser);
      }

      // Check if regular user exists
      const regularUser = await this.getUserByEmail("user@hotellux.com");
      if (!regularUser) {
        console.log("Creating regular user...");
        await this.createUser({
          email: "user@hotellux.com",
          password: "user123",
          firstName: "Regular",
          lastName: "User",
          role: "customer",
        });
        console.log("Regular user created successfully");
      } else {
        console.log("Regular user already exists:", regularUser);
      }

      // Create sample rooms
      const room1 = await db.insert(rooms).values({
        number: "101",
        type: "standard",
        status: "available",
        price: "150.00",
        capacity: 2,
        amenities: ["wifi", "tv", "minibar"],
        images: [
          "https://images.unsplash.com/photo-1540518614846-7eded1dcaeb6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
          "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        ],
        description: "Comfortable standard room with modern amenities",
      });

      const room2 = await db.insert(rooms).values({
        number: "201",
        type: "deluxe",
        status: "available",
        price: "250.00",
        capacity: 3,
        amenities: ["wifi", "tv", "minibar", "balcony", "room-service"],
        images: [
          "https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
          "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        ],
        description:
          "Spacious deluxe room with city view and premium amenities",
      });

      const room3 = await db.insert(rooms).values({
        number: "301",
        type: "suite",
        status: "available",
        price: "400.00",
        capacity: 4,
        amenities: [
          "wifi",
          "tv",
          "minibar",
          "balcony",
          "room-service",
          "jacuzzi",
        ],
        images: [
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
          "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        ],
        description:
          "Luxurious suite with separate living area and premium amenities",
      });

      const room4 = await db.insert(rooms).values({
        number: "401",
        type: "presidential",
        status: "available",
        price: "800.00",
        capacity: 6,
        amenities: [
          "wifi",
          "tv",
          "minibar",
          "balcony",
          "room-service",
          "jacuzzi",
          "kitchen",
        ],
        images: [
          "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
          "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        ],
        description:
          "Presidential suite with panoramic views and exclusive amenities",
      });

      // Create sample booking
      const [existingCustomer] = await db
        .select()
        .from(users)
        .where(eq(users.email, "john@example.com"));
      const [room101] = await db
        .select()
        .from(rooms)
        .where(eq(rooms.number, "101"));

      if (existingCustomer && room101) {
        await db.insert(bookings).values({
          user_id: existingCustomer.id,
          room_id: room101.id,
          check_in: new Date("2024-01-15"),
          check_out: new Date("2024-01-18"),
          guests: 2,
          total_price: "450.00",
          status: "confirmed",
          special_requests: "Late check-in preferred",
        });
      }

      // Create sample Vietnamese hotel services
      await db.insert(services).values({
        name: "Dịch vụ giặt ủi",
        description: "Giặt ủi quần áo khách hàng",
        price: "50000",
        category: "laundry",
      });

      await db.insert(services).values({
        name: "Dịch vụ phòng 24/7",
        description: "Gọi món ăn uống tại phòng",
        price: "30000",
        category: "room_service",
      });

      await db.insert(services).values({
        name: "Massage & Spa",
        description: "Dịch vụ massage thư giãn",
        price: "300000",
        category: "spa",
      });

      await db.insert(services).values({
        name: "Đưa đón sân bay",
        description: "Dịch vụ đưa đón khách từ/đến sân bay",
        price: "200000",
        category: "transport",
      });

      await db.insert(services).values({
        name: "Tour du lịch",
        description: "Hướng dẫn viên du lịch địa phương",
        price: "500000",
        category: "tour",
      });

      // Create sample customers
      await db.insert(users).values({
        email: "nguyenvanan@email.com",
        password: await bcrypt.hash("password", 10),
        first_name: "Nguyễn Văn",
        last_name: "An",
        phone: "0987654321",
        role: "customer",
        preferences: ["luxury", "spa"],
        is_vip: false,
      });

      await db.insert(users).values({
        email: "tranthibinh@email.com",
        password: await bcrypt.hash("password", 10),
        first_name: "Trần Thị",
        last_name: "Bình",
        phone: "0976543210",
        role: "customer",
        preferences: ["wifi", "parking"],
        is_vip: true,
      });
    } catch (error) {
      console.error("Error seeding data:", error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    // Chỉ truyền các trường hợp lệ, loại bỏ undefined/null
    const userData: any = {
      email: insertUser.email,
      password: hashedPassword,
      first_name: insertUser.firstName,
      last_name: insertUser.lastName,
      phone: insertUser.phone || null,
      role: insertUser.role || "customer",
      preferences: Array.isArray(insertUser.preferences)
        ? JSON.stringify(insertUser.preferences)
        : typeof insertUser.preferences === "string"
        ? insertUser.preferences
        : "[]",
      is_vip: insertUser.isVip ? 1 : 0,
    };
    await db.insert(users).values(userData);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, insertUser.email));
    return user;
  }

  async updateUser(
    id: number,
    updates: Partial<User>
  ): Promise<User | undefined> {
    await db.update(users).set(updates).where(eq(users.id, id));
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getRooms(): Promise<Room[]> {
    return await db.select().from(rooms);
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || undefined;
  }

  async getRoomByNumber(number: string): Promise<Room | undefined> {
    const [room] = await db
      .select()
      .from(rooms)
      .where(eq(rooms.number, number));
    return room || undefined;
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const [room] = await db.insert(rooms).values(insertRoom);
    return room;
  }

  async updateRoom(
    id: number,
    updates: Partial<Room>
  ): Promise<Room | undefined> {
    const [room] = await db.update(rooms).set(updates).where(eq(rooms.id, id));
    return room || undefined;
  }

  async deleteRoom(id: number): Promise<boolean> {
    try {
      // First delete all bookings for this room
      await db.delete(bookings).where(eq(bookings.room_id, id));
      // Then delete the room
      const result = await db.delete(rooms).where(eq(rooms.id, id));
      // Kiểm tra giá trị trả về phù hợp với Drizzle/MySQL
      if (Array.isArray(result)) {
        return result.length > 0;
      }
      if (typeof result === "object" && "affectedRows" in result) {
        return result.affectedRows > 0;
      }
      if (typeof result === "object" && "rowCount" in result) {
        return result.rowCount > 0;
      }
      return false;
    } catch (error) {
      console.error("Error deleting room:", error);
      return false;
    }
  }

  async getAvailableRooms(checkIn: Date, checkOut: Date): Promise<Room[]> {
    // Validate input dates
    if (
      !checkIn ||
      !checkOut ||
      isNaN(checkIn.getTime()) ||
      isNaN(checkOut.getTime())
    ) {
      console.error("Debug - Invalid input dates:", { checkIn, checkOut });
      throw new Error("Invalid check-in or check-out dates");
    }

    console.log("Debug - getAvailableRooms called with:", {
      checkIn: checkIn.toString(),
      checkOut: checkOut.toString(),
    });

    // Get all rooms that are available
    const availableRooms = await db
      .select()
      .from(rooms)
      .where(eq(rooms.status, "available"));

    console.log("Debug - All available rooms:", availableRooms.length);

    // Get all non-cancelled bookings (both confirmed and pending to prevent double booking)
    const activeBookings = await db
      .select()
      .from(bookings)
      .where(
        or(
          eq(bookings.status, "confirmed"),
          eq(bookings.status, "pending"),
          eq(bookings.status, "deposit_paid")
        )
      );

    console.log("Debug - Active bookings:", activeBookings.length);
    console.log(
      "Debug - Active bookings data:",
      activeBookings.map((b) => ({
        id: b.id,
        room_id: b.room_id,
        check_in: b.check_in,
        check_out: b.check_out,
        status: b.status,
      }))
    );

    // Filter out rooms with conflicts
    const unavailableRoomIds = new Set();

    for (const booking of activeBookings) {
      try {
        // Convert to local dates for comparison (remove time component)
        const bookingStart = new Date(booking.check_in);
        const bookingEnd = new Date(booking.check_out);

        // Validate dates
        if (isNaN(bookingStart.getTime()) || isNaN(bookingEnd.getTime())) {
          console.log("Debug - Invalid booking dates, skipping:", {
            roomId: booking.room_id,
            check_in: booking.check_in,
            check_out: booking.check_out,
          });
          continue;
        }

        // Set time to start of day for check-in and end of day for check-out
        const bookingStartDate = new Date(
          bookingStart.getFullYear(),
          bookingStart.getMonth(),
          bookingStart.getDate()
        );
        const bookingEndDate = new Date(
          bookingEnd.getFullYear(),
          bookingEnd.getMonth(),
          bookingEnd.getDate()
        );

        const checkInDate = new Date(
          checkIn.getFullYear(),
          checkIn.getMonth(),
          checkIn.getDate()
        );
        const checkOutDate = new Date(
          checkOut.getFullYear(),
          checkOut.getMonth(),
          checkOut.getDate()
        );

        console.log("Debug - Checking booking:", {
          roomId: booking.room_id,
          bookingStartDate: bookingStartDate.toString(),
          bookingEndDate: bookingEndDate.toString(),
          checkInDate: checkInDate.toString(),
          checkOutDate: checkOutDate.toString(),
        });

        // Check for overlap: booking conflicts if requested period overlaps with existing booking
        if (checkInDate < bookingEndDate && checkOutDate > bookingStartDate) {
          console.log("Debug - Conflict found for room:", booking.room_id);
          unavailableRoomIds.add(booking.room_id);
        }
      } catch (error) {
        console.error("Debug - Error processing booking:", {
          roomId: booking.room_id,
          check_in: booking.check_in,
          check_out: booking.check_out,
          error: error.message,
        });
        continue;
      }
    }

    const finalAvailableRooms = availableRooms.filter(
      (room) => !unavailableRoomIds.has(room.id)
    );
    console.log("Debug - Final available rooms:", finalAvailableRooms.length);
    console.log(
      "Debug - Unavailable room IDs:",
      Array.from(unavailableRoomIds)
    );

    return finalAvailableRooms;
  }

  async getBookings(): Promise<(Booking & { user: User; room: Room })[]> {
    const result = await db
      .select({
        booking: bookings,
        user: users,
        room: rooms,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.user_id, users.id))
      .innerJoin(rooms, eq(bookings.room_id, rooms.id));

    return result.map((r) => ({ ...r.booking, user: r.user, room: r.room }));
  }

  async getBooking(
    id: number
  ): Promise<(Booking & { user: User; room: Room }) | undefined> {
    const result = await db
      .select({
        booking: bookings,
        user: users,
        room: rooms,
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.user_id, users.id))
      .innerJoin(rooms, eq(bookings.room_id, rooms.id))
      .where(eq(bookings.id, id));

    const first = result[0];
    return first
      ? { ...first.booking, user: first.user, room: first.room }
      : undefined;
  }

  async getUserBookings(userId: number): Promise<(Booking & { room: Room })[]> {
    const result = await db
      .select({
        booking: bookings,
        room: rooms,
      })
      .from(bookings)
      .innerJoin(rooms, eq(bookings.room_id, rooms.id))
      .where(eq(bookings.user_id, userId));

    return result.map((r) => ({ ...r.booking, room: r.room }));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    console.log("Debug - Storage createBooking input:", insertBooking);

    // Sử dụng connection pool trực tiếp
    const conn = await connection.getConnection();

    try {
      // Bắt đầu transaction
      await conn.beginTransaction();

      // INSERT booking
      const [insertResult] = await conn.execute(
        `
        INSERT INTO bookings (
          user_id, room_id, check_in, check_out, guests, 
          total_price, status, special_requests, check_in_time, check_out_time,
          deposit_amount, remaining_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          insertBooking.userId,
          insertBooking.roomId,
          insertBooking.checkIn,
          insertBooking.checkOut,
          insertBooking.guests,
          insertBooking.totalPrice,
          "pending",
          insertBooking.specialRequests || "",
          insertBooking.checkInTime || "14:00",
          insertBooking.checkOutTime || "12:00",
          insertBooking.depositAmount || null,
          insertBooking.remainingAmount || insertBooking.totalPrice,
        ]
      );

      console.log(
        "Debug - Storage direct connection insert result:",
        insertResult
      );

      // Lấy ID vừa insert
      const [idResult] = await conn.execute("SELECT LAST_INSERT_ID() as id");
      const insertId = (idResult as any)[0].id;

      console.log(
        "Debug - Storage direct connection LAST_INSERT_ID:",
        insertId
      );

      // Lấy booking vừa tạo
      const [bookingResult] = await conn.execute(
        `
        SELECT * FROM bookings WHERE id = ?
      `,
        [insertId]
      );

      const booking = (bookingResult as any)[0];
      console.log("Debug - Storage direct connection found booking:", booking);

      // Commit transaction
      await conn.commit();

      if (!booking) {
        throw new Error(
          `Booking not found after creation. InsertId: ${insertId}`
        );
      }

      return booking;
    } catch (error) {
      // Rollback transaction nếu có lỗi
      await conn.rollback();
      console.error("Debug - Storage createBooking error:", error);
      throw error;
    } finally {
      // Trả connection về pool
      conn.release();
    }
  }

  async updateBooking(
    id: number,
    updates: Partial<Booking>
  ): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set(updates)
      .where(eq(bookings.id, id));
    return booking || undefined;
  }

  async cancelBooking(id: number): Promise<boolean> {
    console.log("Debug - Storage cancelBooking called with id:", id);

    const conn = await connection.getConnection();

    try {
      await conn.beginTransaction();

      const [result] = await conn.execute(
        "UPDATE bookings SET status = ? WHERE id = ?",
        ["cancelled", id]
      );

      console.log("Debug - Storage cancelBooking result:", result);

      const affectedRows = (result as any).affectedRows || 0;
      console.log("Debug - Storage cancelBooking affectedRows:", affectedRows);

      await conn.commit();

      return affectedRows > 0;
    } catch (error) {
      await conn.rollback();
      console.error("Debug - Storage cancelBooking error:", error);
      throw error;
    } finally {
      conn.release();
    }
  }

  // Service methods
  async getServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, id));
    return service || undefined;
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db.insert(services).values(insertService);
    return service;
  }

  async updateService(
    id: number,
    updates: Partial<Service>
  ): Promise<Service | undefined> {
    const [service] = await db
      .update(services)
      .set(updates)
      .where(eq(services.id, id));
    return service || undefined;
  }

  async deleteService(id: number): Promise<boolean> {
    const result = await db.delete(services).where(eq(services.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Chat methods
  async getChatMessages(userId: number): Promise<ChatMessage[]> {
    const messagesWithUser = await db
      .select({
        message: chatMessages,
        user: users,
      })
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.user_id, users.id))
      .where(eq(chatMessages.user_id, userId))
      .orderBy(chatMessages.created_at);

    return messagesWithUser.map((row) => ({
      ...row.message,
      sender_name: row.message.is_from_admin
        ? "Admin"
        : `${row.user?.first_name || ""} ${row.user?.last_name || ""}`.trim(),
    }));
  }

  async createChatMessage(
    insertMessage: InsertChatMessage
  ): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(insertMessage);
    return message;
  }

  async markMessagesAsRead(
    userId: number,
    isFromAdmin?: boolean
  ): Promise<boolean> {
    const condition =
      isFromAdmin !== undefined
        ? and(
            eq(chatMessages.user_id, userId),
            eq(chatMessages.is_from_admin, isFromAdmin)
          )
        : eq(chatMessages.user_id, userId);

    const result = await db
      .update(chatMessages)
      .set({ is_read: true })
      .where(condition);
    return (result.rowCount || 0) > 0;
  }

  // Blog methods
  async getBlogPosts(): Promise<BlogPost[]> {
    try {
      console.log("Querying blog_posts...");
      const [rows] = await connection.query(
        "SELECT * FROM blog_posts WHERE published = 1"
      );
      console.log("Rows:", rows);
      return (rows as any[]).map((post) => ({
        ...post,
        tags: post.tags
          ? typeof post.tags === "string"
            ? JSON.parse(post.tags)
            : post.tags
          : [],
      }));
    } catch (error) {
      console.error("Error querying blog_posts:", error);
      return [];
    }
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id));
    return post || undefined;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug));
    return post || undefined;
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const [post] = await db.insert(blogPosts).values(insertPost);
    return post;
  }

  async updateBlogPost(
    id: number,
    updates: Partial<BlogPost>
  ): Promise<BlogPost | undefined> {
    const [post] = await db
      .update(blogPosts)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(blogPosts.id, id));
    return post || undefined;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const result = await db.delete(blogPosts).where(eq(blogPosts.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Contact Messages Methods
  async getContactMessages(): Promise<any[]> {
    const messages = await db
      .select({
        id: contactMessages.id,
        name: contactMessages.name,
        email: contactMessages.email,
        phone: contactMessages.phone,
        category: contactMessages.category,
        subject: contactMessages.subject,
        message: contactMessages.message,
        preferred_contact: contactMessages.preferred_contact,
        status: contactMessages.status,
        admin_response: contactMessages.admin_response,
        responded_by: contactMessages.responded_by,
        responded_at: contactMessages.responded_at,
        created_at: contactMessages.created_at,
        responded_by_user: {
          id: users.id,
          first_name: users.first_name,
          last_name: users.last_name,
        },
      })
      .from(contactMessages)
      .leftJoin(users, eq(contactMessages.responded_by, users.id))
      .orderBy(desc(contactMessages.created_at));

    if (!messages || !Array.isArray(messages)) {
      return [];
    }
    return messages;
  }

  async getContactMessage(id: number): Promise<any> {
    const [message] = await db
      .select({
        id: contactMessages.id,
        name: contactMessages.name,
        email: contactMessages.email,
        phone: contactMessages.phone,
        category: contactMessages.category,
        subject: contactMessages.subject,
        message: contactMessages.message,
        preferred_contact: contactMessages.preferred_contact,
        status: contactMessages.status,
        admin_response: contactMessages.admin_response,
        responded_by: contactMessages.responded_by,
        responded_at: contactMessages.responded_at,
        created_at: contactMessages.created_at,
        responded_by_user: {
          id: users.id,
          first_name: users.first_name,
          last_name: users.last_name,
        },
      })
      .from(contactMessages)
      .leftJoin(users, eq(contactMessages.responded_by, users.id))
      .where(eq(contactMessages.id, id));

    return message;
  }

  async createContactMessage(insertMessage: any): Promise<any> {
    const [message] = await db.insert(contactMessages).values(insertMessage);
    return message;
  }

  async updateContactMessage(id: number, updates: any): Promise<any> {
    const [message] = await db
      .update(contactMessages)
      .set(updates)
      .where(eq(contactMessages.id, id));
    return message;
  }

  async respondToContactMessage(
    id: number,
    response: string,
    adminId: number
  ): Promise<any> {
    const [message] = await db
      .update(contactMessages)
      .set({
        admin_response: response,
        responded_by: adminId,
        responded_at: new Date(),
        status: "responded",
      })
      .where(eq(contactMessages.id, id));
    return message;
  }

  async deleteContactMessage(id: number): Promise<boolean> {
    try {
      await db.delete(contactMessages).where(eq(contactMessages.id, id));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Review methods implementation
  async getReviews(
    roomId?: number,
    userId?: number,
    limit?: number
  ): Promise<any[]> {
    try {
      let baseQuery = db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          comment: reviews.comment,
          cleanliness: reviews.cleanliness,
          service: reviews.service,
          amenities: reviews.amenities,
          value_for_money: reviews.value_for_money,
          location: reviews.location,
          would_recommend: reviews.would_recommend,
          guest_type: reviews.guest_type,
          stay_purpose: reviews.stay_purpose,
          created_at: reviews.created_at,
          user_name: sql<string>`CONCAT(${users.first_name}, ' ', ${users.last_name})`,
          room_number: rooms.number,
          room_type: rooms.type,
        })
        .from(reviews)
        .leftJoin(users, eq(reviews.user_id, users.id))
        .leftJoin(rooms, eq(reviews.room_id, rooms.id));

      // Apply filters
      if (roomId && userId) {
        baseQuery = baseQuery.where(
          and(eq(reviews.room_id, roomId), eq(reviews.user_id, userId))
        );
      } else if (roomId) {
        baseQuery = baseQuery.where(eq(reviews.room_id, roomId));
      } else if (userId) {
        baseQuery = baseQuery.where(eq(reviews.user_id, userId));
      }

      // Apply ordering
      baseQuery = baseQuery.orderBy(desc(reviews.created_at));

      // Apply limit
      if (limit) {
        baseQuery = baseQuery.limit(limit);
      }

      return await baseQuery;
    } catch (error) {
      console.error("Error fetching reviews:", error);
      return [];
    }
  }

  async createReview(review: any): Promise<any> {
    try {
      const [newReview] = await db.insert(reviews).values({
        user_id: review.user_id,
        room_id: review.room_id,
        booking_id: review.booking_id,
        rating: review.rating,
        comment: review.comment,
        cleanliness: review.cleanliness,
        service: review.service,
        amenities: review.amenities,
        value_for_money: review.value_for_money,
        location: review.location,
        would_recommend: review.would_recommend,
        guest_type: review.guest_type,
        stay_purpose: review.stay_purpose,
      });
      return newReview;
    } catch (error) {
      console.error("Error creating review:", error);
      throw error;
    }
  }

  async getRoomRating(
    roomId: number
  ): Promise<{ averageRating: number; totalReviews: number }> {
    try {
      const [result] = await db
        .select({
          average_rating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
          total_reviews: sql<number>`COUNT(${reviews.id})`,
        })
        .from(reviews)
        .where(eq(reviews.room_id, roomId));
      return {
        averageRating: result.average_rating,
        totalReviews: result.total_reviews,
      };
    } catch (error) {
      console.error("Error fetching room rating:", error);
      return { averageRating: 0, totalReviews: 0 };
    }
  }

  // Loyalty methods
  async getLoyaltyData(userId: number): Promise<any> {
    const [loyaltyData] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    return loyaltyData;
  }

  async getPointTransactions(userId: number): Promise<any[]> {
    const transactions = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    return transactions;
  }

  async updateLoyaltyPoints(
    userId: number,
    points: number,
    type: "earned" | "redeemed",
    description: string
  ): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user) {
      await db
        .update(users)
        .set({ loyalty_points: user.loyalty_points + points })
        .where(eq(users.id, userId));
    }
  }

  // Promotional code methods
  async getPromotionalCodes(): Promise<any[]> {
    const codes = await db.select().from(users).where(eq(users.id, 1)); // Assuming admin user has all codes
    return codes;
  }

  async getAvailablePromotionalCodes(userLevel?: string): Promise<any[]> {
    const codes = await db.select().from(users).where(eq(users.id, 1)); // Assuming admin user has all codes
    return codes;
  }

  async validatePromotionalCode(code: string, amount: number): Promise<any> {
    const [promoCode] = await db.select().from(users).where(eq(users.id, 1)); // Assuming admin user has all codes
    return promoCode;
  }

  async createPromotionalCode(code: any): Promise<any> {
    const [newCode] = await db.insert(users).values(code);
    return newCode;
  }

  async updatePromotionalCode(id: number, updates: any): Promise<any> {
    const [updatedCode] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id));
    return updatedCode;
  }

  // Advanced search
  async searchRooms(filters: any): Promise<any[]> {
    const rooms = await db.select().from(rooms).where(eq(rooms.id, 1)); // Assuming admin user has all rooms
    return rooms;
  }
}

export const storage = new DatabaseStorage();
