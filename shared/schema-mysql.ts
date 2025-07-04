import { mysqlTable, text, int, boolean, timestamp, decimal, json, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  role: varchar("role", { length: 20 }).notNull().default("customer"), // customer, admin
  preferences: json("preferences").$type<string[]>().default([]),
  isVip: boolean("is_vip").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rooms = mysqlTable("rooms", {
  id: int("id").primaryKey().autoincrement(),
  number: varchar("number", { length: 20 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull(), // standard, deluxe, suite, presidential
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  capacity: int("capacity").notNull(),
  amenities: json("amenities").$type<string[]>().default([]),
  images: json("images").$type<string[]>().default([]),
  status: varchar("status", { length: 20 }).notNull().default("available"), // available, booked, maintenance
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookings = mysqlTable("bookings", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  roomId: int("room_id").notNull().references(() => rooms.id),
  checkIn: timestamp("check_in").notNull(),
  checkOut: timestamp("check_out").notNull(),
  checkInTime: varchar("check_in_time", { length: 10 }).default("14:00"),
  checkOutTime: varchar("check_out_time", { length: 10 }).default("12:00"),
  guests: int("guests").notNull(),
  totalPrice: decimal("total_price", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  specialRequests: text("special_requests"),
  paymentIntentId: varchar("payment_intent_id", { length: 255 }),
  paymentMethod: varchar("payment_method", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const services = mysqlTable("services", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 50 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const blogPosts = mysqlTable("blog_posts", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  authorId: int("author_id").notNull().references(() => users.id),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reviews = mysqlTable("reviews", {
  id: int("id").primaryKey().autoincrement(),
  bookingId: int("booking_id").notNull().references(() => bookings.id),
  userId: int("user_id").notNull().references(() => users.id),
  roomId: int("room_id").notNull().references(() => rooms.id),
  rating: int("rating").notNull(),
  comment: text("comment"),
  cleanlinessRating: int("cleanliness_rating"),
  serviceRating: int("service_rating"),
  amenitiesRating: int("amenities_rating"),
  valueRating: int("value_rating"),
  locationRating: int("location_rating"),
  wouldRecommend: boolean("would_recommend").default(true),
  guestType: varchar("guest_type", { length: 20 }),
  stayPurpose: varchar("stay_purpose", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  isAdmin: boolean("is_admin").default(false),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  adminResponse: text("admin_response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const loyaltyPoints = mysqlTable("loyalty_points", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  points: int("points").notNull().default(0),
  level: varchar("level", { length: 20 }).default("bronze"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pointTransactions = mysqlTable("point_transactions", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull().references(() => users.id),
  points: int("points").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  description: text("description"),
  bookingId: int("booking_id").references(() => bookings.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const promotionalCodes = mysqlTable("promotional_codes", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  discountType: varchar("discount_type", { length: 20 }).notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }).default("0"),
  maxUses: int("max_uses").default(1),
  usedCount: int("used_count").default(0),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const promotionalCodeUsage = mysqlTable("promotional_code_usage", {
  id: int("id").primaryKey().autoincrement(),
  codeId: int("code_id").notNull().references(() => promotionalCodes.id),
  userId: int("user_id").notNull().references(() => users.id),
  bookingId: int("booking_id").notNull().references(() => bookings.id),
  usedAt: timestamp("used_at").defaultNow(),
});

export const customers = mysqlTable("customers", {
  id: int("id").primaryKey().autoincrement(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }).notNull(),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookingServices = mysqlTable("booking_services", {
  id: int("id").primaryKey().autoincrement(),
  bookingId: int("booking_id").notNull().references(() => bookings.id),
  serviceId: int("service_id").notNull().references(() => services.id),
  quantity: int("quantity").default(1),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employees = mysqlTable("employees", {
  id: int("id").primaryKey().autoincrement(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  position: varchar("position", { length: 100 }),
  department: varchar("department", { length: 100 }),
  hireDate: timestamp("hire_date"),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoices = mysqlTable("invoices", {
  id: int("id").primaryKey().autoincrement(),
  bookingId: int("booking_id").notNull().references(() => bookings.id),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 15, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 15, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"),
  paymentDate: timestamp("payment_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
});

export const insertRoomSchema = createInsertSchema(rooms).omit({ 
  id: true, 
  createdAt: true 
});

export const insertBookingSchema = createInsertSchema(bookings).omit({ 
  id: true, 
  createdAt: true 
});

export const insertServiceSchema = createInsertSchema(services).omit({ 
  id: true, 
  createdAt: true 
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertReviewSchema = createInsertSchema(reviews).omit({ 
  id: true, 
  createdAt: true 
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ 
  id: true, 
  createdAt: true 
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertPromotionalCodeSchema = createInsertSchema(promotionalCodes).omit({ 
  id: true, 
  createdAt: true 
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ 
  id: true, 
  createdAt: true 
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

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;

export type PromotionalCode = typeof promotionalCodes.$inferSelect;
export type InsertPromotionalCode = z.infer<typeof insertPromotionalCodeSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;