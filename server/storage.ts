import { users, rooms, bookings, type User, type InsertUser, type Room, type InsertRoom, type Booking, type InsertBooking } from "@shared/schema";
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
    const [user] = await db.insert(users).values(insertUser).returning();
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
    const result = await db.delete(rooms).where(eq(rooms.id, id));
    return (result.rowCount || 0) > 0;
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
}

export const storage = new DatabaseStorage();