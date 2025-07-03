import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("customer"), // customer, admin
  preferences: jsonb("preferences").$type<string[]>().default([]),
  isVip: boolean("is_vip").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  number: text("number").notNull().unique(),
  type: text("type").notNull(), // standard, deluxe, suite, presidential
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  capacity: integer("capacity").notNull(),
  amenities: jsonb("amenities").$type<string[]>().default([]),
  images: jsonb("images").$type<string[]>().default([]),
  status: text("status").notNull().default("available"), // available, booked, maintenance
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  roomId: integer("room_id").references(() => rooms.id).notNull(),
  checkIn: timestamp("check_in").notNull(),
  checkOut: timestamp("check_out").notNull(),
  guests: integer("guests").notNull(),
  totalPrice: decimal("total_price", { precision: 15, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, deposit_paid, confirmed, cancelled, completed
  specialRequests: text("special_requests"),
  paymentIntentId: text("payment_intent_id"),
  paymentMethod: text("payment_method"), // stripe, cash_on_arrival, e_wallet
  createdAt: timestamp("created_at").defaultNow(),
});

// Additional tables for comprehensive hotel management
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(), // food, laundry, transport, spa, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookingServices = pgTable("booking_services", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  quantity: integer("quantity").default(1),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  roomTotal: decimal("room_total", { precision: 10, scale: 2 }).notNull(),
  servicesTotal: decimal("services_total", { precision: 10, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"), // cash, bank_transfer, card
  paymentStatus: text("payment_status").default("unpaid"), // unpaid, paid, partial
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  idNumber: text("id_number").notNull().unique(), // CCCD/CMND
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  dateOfBirth: timestamp("date_of_birth"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  employeeCode: text("employee_code").notNull().unique(),
  department: text("department"), // front_desk, housekeeping, management
  position: text("position").notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: text("status").default("active"), // active, inactive, terminated
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  isFromAdmin: boolean("is_from_admin").default(false),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  author: text("author").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array(),
  image: text("image"),
  published: boolean("published").default(false),
  readTime: integer("read_time").default(5),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  phone: true,
  preferences: true,
});

export const insertRoomSchema = createInsertSchema(rooms).pick({
  number: true,
  type: true,
  price: true,
  capacity: true,
  amenities: true,
  images: true,
  description: true,
});

export const insertBookingSchema = createInsertSchema(bookings).pick({
  userId: true,
  roomId: true,
  checkIn: true,
  checkOut: true,
  guests: true,
  totalPrice: true,
  specialRequests: true,
  paymentMethod: true,
}).extend({
  checkIn: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
  checkOut: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
});

export const insertServiceSchema = createInsertSchema(services).pick({
  name: true,
  description: true,
  price: true,
  category: true,
});

export const insertBookingServiceSchema = createInsertSchema(bookingServices).pick({
  bookingId: true,
  serviceId: true,
  quantity: true,
  totalPrice: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).pick({
  bookingId: true,
  invoiceNumber: true,
  roomTotal: true,
  servicesTotal: true,
  taxAmount: true,
  totalAmount: true,
  paymentMethod: true,
  paymentStatus: true,
  paidAmount: true,
  notes: true,
});

export const insertCustomerSchema = createInsertSchema(customers).pick({
  fullName: true,
  idNumber: true,
  phone: true,
  email: true,
  address: true,
  dateOfBirth: true,
  notes: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).pick({
  userId: true,
  employeeCode: true,
  department: true,
  position: true,
  salary: true,
  startDate: true,
  notes: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  message: true,
  isFromAdmin: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).pick({
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  author: true,
  category: true,
  tags: true,
  image: true,
  published: true,
  readTime: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;
export type InsertBookingService = z.infer<typeof insertBookingServiceSchema>;
export type BookingService = typeof bookingServices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

// Review & Rating System
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  roomId: integer("room_id").references(() => rooms.id).notNull(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  title: varchar("title", { length: 255 }),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Loyalty Program
export const loyaltyPoints = pgTable("loyalty_points", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  points: integer("points").default(0).notNull(),
  totalEarned: integer("total_earned").default(0).notNull(),
  level: varchar("level", { length: 50 }).default("Bronze").notNull(), // Bronze, Silver, Gold, Platinum
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pointTransactions = pgTable("point_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  bookingId: integer("booking_id").references(() => bookings.id),
  type: varchar("type", { length: 20 }).notNull(), // "earned", "redeemed"
  points: integer("points").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Promotional Codes
export const promotionalCodes = pgTable("promotional_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  discountType: varchar("discount_type", { length: 20 }).notNull(), // "percentage", "fixed"
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minAmount: decimal("min_amount", { precision: 10, scale: 2 }).default("0"),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").default(0),
  validFrom: timestamp("valid_from").notNull(),
  validTo: timestamp("valid_to").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const promotionalCodeUsage = pgTable("promotional_code_usage", {
  id: serial("id").primaryKey(),
  codeId: integer("code_id").references(() => promotionalCodes.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  bookingId: integer("booking_id").references(() => bookings.id).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas for new tables
export const insertReviewSchema = createInsertSchema(reviews).pick({
  userId: true,
  roomId: true,
  bookingId: true,
  rating: true,
  title: true,
  comment: true,
});

export const insertLoyaltyPointsSchema = createInsertSchema(loyaltyPoints).pick({
  userId: true,
  points: true,
  totalEarned: true,
  level: true,
});

export const insertPointTransactionSchema = createInsertSchema(pointTransactions).pick({
  userId: true,
  bookingId: true,
  type: true,
  points: true,
  description: true,
});

export const insertPromotionalCodeSchema = createInsertSchema(promotionalCodes).pick({
  code: true,
  name: true,
  description: true,
  discountType: true,
  discountValue: true,
  minAmount: true,
  maxDiscount: true,
  usageLimit: true,
  validFrom: true,
  validTo: true,
  isActive: true,
});

export const insertPromotionalCodeUsageSchema = createInsertSchema(promotionalCodeUsage).pick({
  codeId: true,
  userId: true,
  bookingId: true,
  discountAmount: true,
});

// Types for new tables
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertLoyaltyPoints = z.infer<typeof insertLoyaltyPointsSchema>;
export type LoyaltyPoints = typeof loyaltyPoints.$inferSelect;
export type InsertPointTransaction = z.infer<typeof insertPointTransactionSchema>;
export type PointTransaction = typeof pointTransactions.$inferSelect;
export type InsertPromotionalCode = z.infer<typeof insertPromotionalCodeSchema>;
export type PromotionalCode = typeof promotionalCodes.$inferSelect;
export type InsertPromotionalCodeUsage = z.infer<typeof insertPromotionalCodeUsageSchema>;
export type PromotionalCodeUsage = typeof promotionalCodeUsage.$inferSelect;
