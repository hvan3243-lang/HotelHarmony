import { 
  users, rooms, bookings, services, customers, employees, invoices, chatMessages, blogPosts,
  type User, type InsertUser, type Room, type InsertRoom, type Booking, type InsertBooking,
  type Service, type InsertService, type Customer, type InsertCustomer, type Employee, type InsertEmployee,
  type Invoice, type InsertInvoice, type ChatMessage, type InsertChatMessage, type BlogPost, type InsertBlogPost
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, or } from "drizzle-orm";
import bcrypt from "bcrypt";

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
  getBooking(id: number): Promise<(Booking & { user: User; room: Room }) | undefined>;
  getUserBookings(userId: number): Promise<(Booking & { room: Room })[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, updates: Partial<Booking>): Promise<Booking | undefined>;
  cancelBooking(id: number): Promise<boolean>;
  
  // Service methods
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, updates: Partial<Service>): Promise<Service | undefined>;
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
  updateBlogPost(id: number, updates: Partial<BlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Seed data when the storage is initialized
    this.seedData();
  }

  private async seedData() {
    try {
      // Check if admin user already exists
      const existingAdmin = await db.select().from(users).where(eq(users.email, "admin@hotellux.com"));
      if (existingAdmin.length === 0) {
        // Create admin user
        const adminPassword = await bcrypt.hash("admin123", 10);
        const [adminUser] = await db.insert(users).values({
          email: "admin@hotellux.com",
          password: adminPassword,
          firstName: "Admin",
          lastName: "User",
          phone: "+1-555-0100",
          role: "admin",
          preferences: ["luxury", "spa"],
          isVip: false
        }).returning();

        // Create customer user
        const customerPassword = await bcrypt.hash("customer123", 10);
        await db.insert(users).values({
          email: "john@example.com",
          password: customerPassword,
          firstName: "John",
          lastName: "Doe", 
          phone: "+1-555-0101",
          role: "customer",
          preferences: ["wifi", "parking"],
          isVip: true
        });

        // Create sample rooms
        const room1 = await db.insert(rooms).values({
          number: "101",
          type: "standard",
          status: "available",
          price: "150.00",
          capacity: 2,
          amenities: ["wifi", "tv", "minibar"],
          images: ["/api/placeholder/400/300", "/api/placeholder/400/300"],
          description: "Comfortable standard room with modern amenities"
        }).returning();

        const room2 = await db.insert(rooms).values({
          number: "201",
          type: "deluxe", 
          status: "available",
          price: "250.00",
          capacity: 3,
          amenities: ["wifi", "tv", "minibar", "balcony", "room-service"],
          images: ["/api/placeholder/400/300", "/api/placeholder/400/300"],
          description: "Spacious deluxe room with city view and premium amenities"
        }).returning();

        const room3 = await db.insert(rooms).values({
          number: "301",
          type: "suite",
          status: "available", 
          price: "400.00",
          capacity: 4,
          amenities: ["wifi", "tv", "minibar", "balcony", "room-service", "jacuzzi"],
          images: ["/api/placeholder/400/300", "/api/placeholder/400/300"],
          description: "Luxurious suite with separate living area and premium amenities"
        }).returning();

        const room4 = await db.insert(rooms).values({
          number: "401",
          type: "presidential",
          status: "available",
          price: "800.00", 
          capacity: 6,
          amenities: ["wifi", "tv", "minibar", "balcony", "room-service", "jacuzzi", "kitchen"],
          images: ["/api/placeholder/400/300", "/api/placeholder/400/300"],
          description: "Presidential suite with panoramic views and exclusive amenities"
        }).returning();

        // Create sample booking
        const [existingCustomer] = await db.select().from(users).where(eq(users.email, "john@example.com"));
        const [room101] = await db.select().from(rooms).where(eq(rooms.number, "101"));
        
        if (existingCustomer && room101) {
          await db.insert(bookings).values({
            userId: existingCustomer.id,
            roomId: room101.id,
            checkIn: new Date('2024-01-15'),
            checkOut: new Date('2024-01-18'),
            guests: 2,
            totalPrice: "450.00",
            status: "confirmed",
            specialRequests: "Late check-in preferred"
          });
        }

        // Create sample Vietnamese hotel services
        await db.insert(services).values({
          name: "Dịch vụ giặt ủi",
          description: "Giặt ủi quần áo khách hàng",
          price: "50000",
          category: "laundry"
        });

        await db.insert(services).values({
          name: "Dịch vụ phòng 24/7",
          description: "Gọi món ăn uống tại phòng",
          price: "30000",
          category: "room_service"
        });

        await db.insert(services).values({
          name: "Massage & Spa",
          description: "Dịch vụ massage thư giãn",
          price: "300000",
          category: "spa"
        });

        await db.insert(services).values({
          name: "Đưa đón sân bay",
          description: "Dịch vụ đưa đón khách từ/đến sân bay",
          price: "200000",
          category: "transport"
        });

        await db.insert(services).values({
          name: "Tour du lịch",
          description: "Hướng dẫn viên du lịch địa phương",
          price: "500000",
          category: "tour"
        });

        // Create sample customers
        await db.insert(customers).values({
          fullName: "Nguyễn Văn An",
          idNumber: "001234567890",
          phone: "0987654321",
          email: "nguyenvanan@email.com",
          address: "123 Đường ABC, Quận 1, TP.HCM"
        });

        await db.insert(customers).values({
          fullName: "Trần Thị Bình",
          idNumber: "001234567891",
          phone: "0976543210",
          email: "tranthibinh@email.com",
          address: "456 Đường XYZ, Quận 3, TP.HCM"
        });
      }
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
    // Hash password before saving
    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const [user] = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword
    }).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
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
    const [room] = await db.select().from(rooms).where(eq(rooms.number, number));
    return room || undefined;
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const [room] = await db.insert(rooms).values(insertRoom).returning();
    return room;
  }

  async updateRoom(id: number, updates: Partial<Room>): Promise<Room | undefined> {
    const [room] = await db.update(rooms).set(updates).where(eq(rooms.id, id)).returning();
    return room || undefined;
  }

  async deleteRoom(id: number): Promise<boolean> {
    try {
      // First delete all bookings for this room
      await db.delete(bookings).where(eq(bookings.roomId, id));
      // Then delete the room
      const result = await db.delete(rooms).where(eq(rooms.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting room:', error);
      return false;
    }
  }

  async getAvailableRooms(checkIn: Date, checkOut: Date): Promise<Room[]> {
    // Get all rooms that are available
    const availableRooms = await db.select().from(rooms).where(eq(rooms.status, 'available'));
    
    // Get all confirmed bookings and filter in JavaScript for now
    const confirmedBookings = await db.select()
      .from(bookings)
      .where(eq(bookings.status, 'confirmed'));
    
    // Filter out rooms with conflicts
    const unavailableRoomIds = new Set();
    
    for (const booking of confirmedBookings) {
      const bookingStart = new Date(booking.checkIn);
      const bookingEnd = new Date(booking.checkOut);
      
      // Check for overlap
      if (checkIn < bookingEnd && checkOut > bookingStart) {
        unavailableRoomIds.add(booking.roomId);
      }
    }
    
    return availableRooms.filter(room => !unavailableRoomIds.has(room.id));
  }

  async getBookings(): Promise<(Booking & { user: User; room: Room })[]> {
    const result = await db.select({
      booking: bookings,
      user: users,
      room: rooms
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.userId, users.id))
    .innerJoin(rooms, eq(bookings.roomId, rooms.id));

    return result.map(r => ({ ...r.booking, user: r.user, room: r.room }));
  }

  async getBooking(id: number): Promise<(Booking & { user: User; room: Room }) | undefined> {
    const result = await db.select({
      booking: bookings,
      user: users,
      room: rooms
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.userId, users.id))
    .innerJoin(rooms, eq(bookings.roomId, rooms.id))
    .where(eq(bookings.id, id));

    const first = result[0];
    return first ? { ...first.booking, user: first.user, room: first.room } : undefined;
  }

  async getUserBookings(userId: number): Promise<(Booking & { room: Room })[]> {
    const result = await db.select({
      booking: bookings,
      room: rooms
    })
    .from(bookings)
    .innerJoin(rooms, eq(bookings.roomId, rooms.id))
    .where(eq(bookings.userId, userId));

    return result.map(r => ({ ...r.booking, room: r.room }));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values({
      ...insertBooking,
      status: "pending"
    }).returning();
    return booking;
  }

  async updateBooking(id: number, updates: Partial<Booking>): Promise<Booking | undefined> {
    const [booking] = await db.update(bookings).set(updates).where(eq(bookings.id, id)).returning();
    return booking || undefined;
  }

  async cancelBooking(id: number): Promise<boolean> {
    const result = await db.update(bookings)
      .set({ status: "cancelled" })
      .where(eq(bookings.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Service methods
  async getServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db.insert(services).values(insertService).returning();
    return service;
  }

  async updateService(id: number, updates: Partial<Service>): Promise<Service | undefined> {
    const [service] = await db.update(services).set(updates).where(eq(services.id, id)).returning();
    return service || undefined;
  }

  async deleteService(id: number): Promise<boolean> {
    const result = await db.delete(services).where(eq(services.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Chat methods
  async getChatMessages(userId: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.userId, userId)).orderBy(chatMessages.createdAt);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(insertMessage).returning();
    return message;
  }

  async markMessagesAsRead(userId: number, isFromAdmin?: boolean): Promise<boolean> {
    const condition = isFromAdmin !== undefined 
      ? and(eq(chatMessages.userId, userId), eq(chatMessages.isFromAdmin, isFromAdmin))
      : eq(chatMessages.userId, userId);
    
    const result = await db.update(chatMessages).set({ isRead: true }).where(condition);
    return (result.rowCount || 0) > 0;
  }

  // Blog methods
  async getBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts).orderBy(blogPosts.createdAt);
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post || undefined;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post || undefined;
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const [post] = await db.insert(blogPosts).values(insertPost).returning();
    return post;
  }

  async updateBlogPost(id: number, updates: Partial<BlogPost>): Promise<BlogPost | undefined> {
    const [post] = await db.update(blogPosts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return post || undefined;
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    const result = await db.delete(blogPosts).where(eq(blogPosts.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();