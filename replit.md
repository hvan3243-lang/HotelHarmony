# HotelLux - Modern Hotel Management System

## Overview

HotelLux is a full-stack hotel management application built with React, TypeScript, Express.js, and PostgreSQL. The system provides a comprehensive platform for hotel room booking, customer management, and administrative operations with a modern, responsive interface using Tailwind CSS and shadcn/ui components.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion for smooth transitions and interactions
- **Theme**: Dark/light mode support with persistent theme storage

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Payment Processing**: Stripe integration for secure payments
- **Email Service**: SendGrid for transactional emails
- **Development Server**: Vite with HMR support

### Build System
- **Bundler**: Vite for frontend development and building
- **TypeScript**: Strict type checking across the entire codebase
- **PostCSS**: For Tailwind CSS processing
- **ESBuild**: For backend bundling in production

## Key Components

### Database Schema
- **Users Table**: Customer and admin user management with roles, preferences, and VIP status
- **Rooms Table**: Room inventory with types (standard, deluxe, suite, presidential), pricing, amenities, and availability status
- **Bookings Table**: Reservation management with check-in/out dates, guest count, pricing, and payment integration

### Authentication System
- JWT-based authentication with role-based access control (customer/admin)
- Secure password hashing using bcrypt
- Token storage in localStorage with automatic session management
- Protected routes with middleware authentication

### Payment Integration
- Stripe payment processing with secure payment intents
- Real-time payment confirmation and booking updates
- Support for various payment methods
- Automated booking confirmation emails

### Admin Dashboard
- Room management (CRUD operations)
- Booking oversight and status management
- User management and analytics
- Revenue tracking and reporting

### Customer Portal
- Profile management with preferences
- Booking history and status tracking
- Room search and filtering
- Special requests and customization options

## Data Flow

1. **User Registration/Login**: Users authenticate through JWT tokens stored locally
2. **Room Search**: Frontend queries available rooms based on date range and filters
3. **Booking Process**: Multi-step booking with room selection, guest details, and payment
4. **Payment Processing**: Stripe handles secure payment processing with webhooks
5. **Confirmation**: Email notifications sent via SendGrid upon successful booking
6. **Admin Management**: Real-time updates to room availability and booking status

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **@stripe/stripe-js** & **@stripe/react-stripe-js**: Payment processing
- **@sendgrid/mail**: Email service integration
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Type-safe database operations
- **framer-motion**: Animation library
- **wouter**: Lightweight React router

### UI Components
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Tools
- **vite**: Development server and build tool
- **typescript**: Type safety
- **@replit/vite-plugin-runtime-error-modal**: Development error handling

## Deployment Strategy

### Development Environment
- Vite development server with hot module replacement
- In-memory storage fallback for development without database
- Environment variable validation with graceful degradation
- Replit integration with cartographer plugin for development

### Production Build
- Frontend: Vite builds optimized static assets
- Backend: ESBuild bundles Node.js server code
- Single deployment artifact with both frontend and backend
- PostgreSQL database with Drizzle migrations
- Environment-based configuration for external services

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret
- `STRIPE_SECRET_KEY`: Stripe API key
- `SENDGRID_API_KEY`: SendGrid API key
- `VITE_STRIPE_PUBLIC_KEY`: Stripe public key for frontend

## Changelog
- July 02, 2025. Initial setup
- July 02, 2025. Added PostgreSQL database integration with Drizzle ORM, replacing in-memory storage with persistent database storage
- July 02, 2025. Fixed critical authentication issues - JWT tokens now properly sent with all API requests
- July 02, 2025. Resolved booking system validation errors - customers can now successfully book rooms
- July 02, 2025. Fixed room deletion constraints - admin can now delete rooms (bookings are deleted first)
- July 02, 2025. Enhanced chat system - admin can now respond to specific customers via targetUserId parameter
- July 02, 2025. Added real QR code payment integration - replaced mock QR with user's VietQR code (DANG VAN HOANG - 0389597728)
- July 02, 2025. Implemented booking cancellation with smart refund policy (100% >48h, 50% 24-48h, 0% <24h)
- July 02, 2025. Added detailed booking view dialog with complete information display for customers

## User Preferences

Preferred communication style: Simple, everyday language.