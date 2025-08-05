import {
  datetime,
  decimal,
  int,
  longtext,
  mysqlTable,
  text,
  timestamp,
  tinyint,
  varchar,
} from "drizzle-orm/mysql-core";
import { z } from "zod";

export const blogPosts = mysqlTable("blog_posts", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  excerpt: text("excerpt"),
  content: longtext("content").notNull(),
  author: varchar("author", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  tags: longtext("tags").default("[]"),
  image: varchar("image", { length: 255 }),
  published: tinyint("published").default(0),
  read_time: int("read_time").default(5),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const bookings = mysqlTable("bookings", {
  id: int("id").primaryKey().autoincrement(),
  user_id: int("user_id"),
  room_id: int("room_id"),
  check_in: datetime("check_in").notNull(),
  check_out: datetime("check_out").notNull(),
  guests: int("guests").notNull(),
  total_amount: decimal("total_amount", { precision: 10, scale: 2 }),
  total_price: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  special_requests: text("special_requests"),
  payment_intent_id: varchar("payment_intent_id", { length: 255 }),
  payment_method: varchar("payment_method", { length: 100 }),
  check_in_time: varchar("check_in_time", { length: 10 }).default("14:00"),
  check_out_time: varchar("check_out_time", { length: 10 }).default("12:00"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  deposit_amount: decimal("deposit_amount", { precision: 10, scale: 2 }),
  remaining_amount: decimal("remaining_amount", { precision: 10, scale: 2 }),
});

export const bookingServices = mysqlTable("booking_services", {
  id: int("id").primaryKey().autoincrement(),
  booking_id: int("booking_id"),
  service_id: int("service_id"),
  quantity: int("quantity").default(1),
  total_price: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").primaryKey().autoincrement(),
  user_id: int("user_id"),
  message: text("message").notNull(),
  is_from_admin: tinyint("is_from_admin"),
  is_read: tinyint("is_read").default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  category: varchar("category", { length: 100 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),
  preferred_contact: varchar("preferred_contact", { length: 20 }).default(
    "email"
  ),
  status: varchar("status", { length: 20 }).default("pending"),
  admin_response: text("admin_response"),
  responded_by: int("responded_by"),
  responded_at: timestamp("responded_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const customers = mysqlTable("customers", {
  id: int("id").primaryKey().autoincrement(),
  full_name: varchar("full_name", { length: 255 }).notNull(),
  id_number: varchar("id_number", { length: 50 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  date_of_birth: datetime("date_of_birth"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const employees = mysqlTable("employees", {
  id: int("id").primaryKey().autoincrement(),
  user_id: int("user_id"),
  employee_code: varchar("employee_code", { length: 50 }).notNull(),
  department: varchar("department", { length: 100 }),
  position: varchar("position", { length: 100 }).notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }),
  start_date: datetime("start_date").notNull(),
  end_date: datetime("end_date"),
  status: varchar("status", { length: 50 }).default("active"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const invoices = mysqlTable("invoices", {
  id: int("id").primaryKey().autoincrement(),
  booking_id: int("booking_id"),
  invoice_number: varchar("invoice_number", { length: 100 }).notNull(),
  room_total: decimal("room_total", { precision: 10, scale: 2 }).notNull(),
  services_total: decimal("services_total", {
    precision: 10,
    scale: 2,
  }).default(0.0),
  tax_amount: decimal("tax_amount", { precision: 10, scale: 2 }).default(0.0),
  total_amount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  payment_method: varchar("payment_method", { length: 50 }),
  payment_status: varchar("payment_status", { length: 50 }).default("unpaid"),
  paid_amount: decimal("paid_amount", { precision: 10, scale: 2 }).default(0.0),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const loyaltyPoints = mysqlTable("loyalty_points", {
  id: int("id").primaryKey().autoincrement(),
  user_id: int("user_id"),
  points: int("points").default(0),
  total_earned: int("total_earned").default(0),
  level: varchar("level", { length: 20 }).default("Bronze"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const pointTransactions = mysqlTable("point_transactions", {
  id: int("id").primaryKey().autoincrement(),
  user_id: int("user_id"),
  booking_id: int("booking_id"),
  type: varchar("type", { length: 20 }).notNull(),
  points: int("points").notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const promotionalCodes = mysqlTable("promotional_codes", {
  id: int("id").primaryKey().autoincrement(),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  discount_type: varchar("discount_type", { length: 20 }).notNull(),
  discount_value: decimal("discount_value", {
    precision: 10,
    scale: 2,
  }).notNull(),
  min_amount: decimal("min_amount", { precision: 10, scale: 2 }).default(0.0),
  max_discount: decimal("max_discount", { precision: 10, scale: 2 }),
  usage_limit: int("usage_limit"),
  used_count: int("used_count").default(0),
  valid_from: datetime("valid_from").notNull(),
  valid_to: datetime("valid_to").notNull(),
  is_active: tinyint("is_active").default(1),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const promotionalCodeUsage = mysqlTable("promotional_code_usage", {
  id: int("id").primaryKey().autoincrement(),
  code_id: int("code_id"),
  user_id: int("user_id"),
  booking_id: int("booking_id"),
  discount_amount: decimal("discount_amount", {
    precision: 10,
    scale: 2,
  }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const reviews = mysqlTable("reviews", {
  id: int("id").primaryKey().autoincrement(),
  user_id: int("user_id"),
  room_id: int("room_id"),
  booking_id: int("booking_id"),
  rating: int("rating").notNull(),
  title: varchar("title", { length: 255 }),
  comment: text("comment"),
  cleanliness: int("cleanliness").default(5),
  service: int("service").default(5),
  amenities: int("amenities").default(5),
  value_for_money: int("value_for_money").default(5),
  location: int("location").default(5),
  would_recommend: tinyint("would_recommend").default(1),
  guest_type: varchar("guest_type", { length: 50 }).default("Individual"),
  stay_purpose: varchar("stay_purpose", { length: 50 }).default("Leisure"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const rooms = mysqlTable("rooms", {
  id: int("id").primaryKey().autoincrement(),
  number: varchar("number", { length: 20 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  capacity: int("capacity").notNull(),
  amenities: longtext("amenities").default("[]"),
  images: longtext("images").default("[]"),
  status: varchar("status", { length: 50 }).default("available"),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const services = mysqlTable("services", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  is_active: tinyint("is_active").default(1),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  first_name: varchar("first_name", { length: 100 }).notNull(),
  last_name: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  role: varchar("role", { length: 50 }).default("customer"),
  preferences: longtext("preferences").default("[]"),
  is_vip: tinyint("is_vip").default(0),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertBlogPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  author: z.string().min(1),
  category: z.string().min(1),
  tags: z.string().optional(),
  image: z.string().optional(),
  published: z.number().optional(),
  read_time: z.number().optional(),
});

export const insertBookingSchema = z.object({
  userId: z.number(),
  roomId: z.number(),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.number(),
  totalAmount: z.string().optional(),
  totalPrice: z.string(),
  status: z.string().optional(),
  specialRequests: z.string().optional(),
  paymentIntentId: z.string().optional(),
  paymentMethod: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  depositAmount: z.string().optional(),
  remainingAmount: z.string().optional(),
});

export const insertRoomSchema = z.object({
  number: z.string().min(1),
  type: z.string().min(1),
  price: z.string().min(1),
  capacity: z.number().min(1),
  amenities: z.string().optional(),
  images: z.string().optional(),
  status: z.string().optional(),
  description: z.string().optional(),
});

export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.string().optional(),
  preferences: z.string().optional(),
  isVip: z.boolean().optional(),
});
