import { users, rooms, bookings, type User, type InsertUser, type Room, type InsertRoom, type Booking, type InsertBooking } from "@shared/schema";
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rooms: Map<number, Room>;
  private bookings: Map<number, Booking>;
  private currentUserId: number;
  private currentRoomId: number;
  private currentBookingId: number;

  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.bookings = new Map();
    this.currentUserId = 1;
    this.currentRoomId = 1;
    this.currentBookingId = 1;
    
    this.seedData();
  }

  private async seedData() {
    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin: User = {
      id: this.currentUserId++,
      email: "admin@hotellux.com",
      password: adminPassword,
      firstName: "Admin",
      lastName: "HotelLux",
      phone: "0123456789",
      role: "admin",
      preferences: [],
      isVip: false,
      createdAt: new Date(),
    };
    this.users.set(admin.id, admin);

    // Create sample customer
    const customerPassword = await bcrypt.hash("customer123", 10);
    const customer: User = {
      id: this.currentUserId++,
      email: "customer@example.com",
      password: customerPassword,
      firstName: "Nguyễn",
      lastName: "Văn A",
      phone: "0987654321",
      role: "customer",
      preferences: ["view biển", "spa", "sang trọng"],
      isVip: true,
      createdAt: new Date(),
    };
    this.users.set(customer.id, customer);

    // Create sample rooms
    const sampleRooms: Room[] = [
      {
        id: this.currentRoomId++,
        number: "101",
        type: "standard",
        price: "800000",
        capacity: 2,
        amenities: ["WiFi", "TV", "AC"],
        images: ["https://images.unsplash.com/photo-1618773928121-c32242e63f39"],
        status: "available",
        description: "Phòng tiêu chuẩn với đầy đủ tiện nghi",
        createdAt: new Date(),
      },
      {
        id: this.currentRoomId++,
        number: "201",
        type: "deluxe",
        price: "1500000",
        capacity: 2,
        amenities: ["WiFi", "TV", "AC", "Balcony", "City View"],
        images: ["https://images.unsplash.com/photo-1618773928121-c32242e63f39"],
        status: "available",
        description: "Phòng Deluxe với view thành phố",
        createdAt: new Date(),
      },
      {
        id: this.currentRoomId++,
        number: "301",
        type: "suite",
        price: "2800000",
        capacity: 4,
        amenities: ["WiFi", "TV", "AC", "Ocean View", "Balcony", "Jacuzzi"],
        images: ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b"],
        status: "available",
        description: "Suite Ocean View với tầm nhìn panoramic",
        createdAt: new Date(),
      },
      {
        id: this.currentRoomId++,
        number: "401",
        type: "presidential",
        price: "8500000",
        capacity: 6,
        amenities: ["WiFi", "TV", "AC", "Ocean View", "Private Pool", "Butler Service", "Helicopter Pad"],
        images: ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4"],
        status: "available",
        description: "Presidential Suite với dịch vụ butler 24/7",
        createdAt: new Date(),
      },
    ];

    sampleRooms.forEach(room => {
      this.rooms.set(room.id, room);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      ...insertUser,
      id: this.currentUserId++,
      password: hashedPassword,
      role: "customer",
      isVip: false,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Room methods
  async getRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }

  async getRoom(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async getRoomByNumber(number: string): Promise<Room | undefined> {
    return Array.from(this.rooms.values()).find(room => room.number === number);
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const room: Room = {
      ...insertRoom,
      id: this.currentRoomId++,
      status: "available",
      createdAt: new Date(),
    };
    this.rooms.set(room.id, room);
    return room;
  }

  async updateRoom(id: number, updates: Partial<Room>): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;
    
    const updatedRoom = { ...room, ...updates };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  async deleteRoom(id: number): Promise<boolean> {
    return this.rooms.delete(id);
  }

  async getAvailableRooms(checkIn: Date, checkOut: Date): Promise<Room[]> {
    const bookedRoomIds = new Set();
    
    // Find rooms that are booked during the requested period
    for (const booking of this.bookings.values()) {
      if (booking.status === "confirmed" || booking.status === "pending") {
        const bookingCheckIn = new Date(booking.checkIn);
        const bookingCheckOut = new Date(booking.checkOut);
        
        // Check for overlap
        if (checkIn < bookingCheckOut && checkOut > bookingCheckIn) {
          bookedRoomIds.add(booking.roomId);
        }
      }
    }
    
    return Array.from(this.rooms.values()).filter(
      room => room.status === "available" && !bookedRoomIds.has(room.id)
    );
  }

  // Booking methods
  async getBookings(): Promise<(Booking & { user: User; room: Room })[]> {
    const bookingsWithDetails = [];
    
    for (const booking of this.bookings.values()) {
      const user = this.users.get(booking.userId);
      const room = this.rooms.get(booking.roomId);
      
      if (user && room) {
        bookingsWithDetails.push({ ...booking, user, room });
      }
    }
    
    return bookingsWithDetails;
  }

  async getBooking(id: number): Promise<(Booking & { user: User; room: Room }) | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const user = this.users.get(booking.userId);
    const room = this.rooms.get(booking.roomId);
    
    if (!user || !room) return undefined;
    
    return { ...booking, user, room };
  }

  async getUserBookings(userId: number): Promise<(Booking & { room: Room })[]> {
    const userBookings = [];
    
    for (const booking of this.bookings.values()) {
      if (booking.userId === userId) {
        const room = this.rooms.get(booking.roomId);
        if (room) {
          userBookings.push({ ...booking, room });
        }
      }
    }
    
    return userBookings.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const booking: Booking = {
      ...insertBooking,
      id: this.currentBookingId++,
      status: "pending",
      paymentIntentId: null,
      createdAt: new Date(),
    };
    this.bookings.set(booking.id, booking);
    return booking;
  }

  async updateBooking(id: number, updates: Partial<Booking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updatedBooking = { ...booking, ...updates };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  async cancelBooking(id: number): Promise<boolean> {
    const booking = this.bookings.get(id);
    if (!booking) return false;
    
    booking.status = "cancelled";
    this.bookings.set(id, booking);
    return true;
  }
}

export const storage = new MemStorage();
