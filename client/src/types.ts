export interface Room {
  id: number;
  name: string;
  type: string;
  price: number;
  capacity: number;
  description?: string;
  amenities?: string[];
  images?: string[];
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  isActive: boolean;
}

export interface BlogPost {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  author: string;
  category: string;
  tags?: string[];
  image?: string;
  published: boolean;
  read_time?: string;
}

export interface Booking {
  id: number;
  roomId: number;
  userId: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: string;
  specialRequests?: string;
  checkInTime?: string;
  checkOutTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
