import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  blogPosts,
  bookings,
  chatMessages,
  rooms,
  services,
  users,
} from "../shared/schema";

export type User = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;

export type Room = InferSelectModel<typeof rooms>;
export type InsertRoom = InferInsertModel<typeof rooms>;

export type Booking = InferSelectModel<typeof bookings>;
export type InsertBooking = InferInsertModel<typeof bookings>;

export type Service = InferSelectModel<typeof services>;
export type InsertService = InferInsertModel<typeof services>;

export type BlogPost = InferSelectModel<typeof blogPosts>;
export type InsertBlogPost = InferInsertModel<typeof blogPosts>;

export type ChatMessage = InferSelectModel<typeof chatMessages>;
export type InsertChatMessage = InferInsertModel<typeof chatMessages>;
