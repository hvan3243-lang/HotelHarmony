import { mysqlTable, text, int, boolean, timestamp, decimal, json, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("customer"), // customer, admin
  preferences: json("preferences").$type<string[]>().default([]),
  isVip: boolean("is_vip").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rooms = mysqlTable("rooms", {
  id: int("id").primaryKey().autoincrement(),
  number: text("number").notNull().unique(),
  type: text("type").notNull(), // standard, deluxe, suite, presidential
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  capacity: int("capacity").notNull(),
  amenities: json("amenities").$type<string[]>().default([]),
  images: json("images").$type<string[]>().default([]),
  status: text("status").notNull().default("available"), // available, occupied, maintenance
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookings = mysqlTable("bookings", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  roomId: int("room_id").notNull(),
  checkIn: timestamp("check_in").notNull(),
  checkOut: timestamp("check_out").notNull(),
  checkInTime: text("check_in_time").default("14:00"),
  checkOutTime: text("check_out_time").default("12:00"),
  guests: int("guests").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }).notNull(),
  remainingAmount: decimal("remaining_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, deposit_paid, confirmed, cancelled, completed
  paymentMethod: text("payment_method").default("credit_card"), // credit_card, qr_code, cash
  paymentIntentId: text("payment_intent_id"),
  specialRequests: text("special_requests"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const services = mysqlTable("services", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(), // spa, restaurant, transportation, etc.
  available: boolean("available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  message: text("message").notNull(),
  isFromAdmin: boolean("is_from_admin").default(false),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const blogPosts = mysqlTable("blog_posts", {
  id: int("id").primaryKey().autoincrement(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  imageUrl: text("image_url"),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"), // new, in_progress, resolved
  response: text("response"),
  respondedBy: int("responded_by"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = mysqlTable("reviews", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  roomId: int("room_id").notNull(),
  bookingId: int("booking_id").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const loyaltyPoints = mysqlTable("loyalty_points", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  points: int("points").notNull().default(0),
  level: text("level").notNull().default("Bronze"), // Bronze, Silver, Gold, Platinum
  totalEarned: int("total_earned").notNull().default(0),
  totalRedeemed: int("total_redeemed").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pointTransactions = mysqlTable("point_transactions", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  points: int("points").notNull(), // positive for earned, negative for redeemed
  type: text("type").notNull(), // earned, redeemed
  description: text("description").notNull(),
  bookingId: int("booking_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const promotionalCodes = mysqlTable("promotional_codes", {
  id: int("id").primaryKey().autoincrement(),
  code: text("code").notNull().unique(),
  description: text("description"),
  discountType: text("discount_type").notNull(), // percentage, fixed
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minAmount: decimal("min_amount", { precision: 10, scale: 2 }).default("0"),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
  userLevel: text("user_level"), // Bronze, Silver, Gold, Platinum, null for all
  usageLimit: int("usage_limit"),
  usedCount: int("used_count").default(0),
  validFrom: timestamp("valid_from").notNull(),
  validTo: timestamp("valid_to").notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertPromotionalCodeSchema = createInsertSchema(promotionalCodes).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type LoyaltyPoints = typeof loyaltyPoints.$inferSelect;
export type PointTransaction = typeof pointTransactions.$inferSelect;

export type PromotionalCode = typeof promotionalCodes.$inferSelect;
export type InsertPromotionalCode = z.infer<typeof insertPromotionalCodeSchema>;