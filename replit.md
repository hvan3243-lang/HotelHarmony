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
- July 02, 2025. Restructured admin interface to 3 tabs only: Dashboard, Quản lý phòng, Quản lý dịch vụ (removed unused pages)
- July 02, 2025. Enhanced UI/UX with modern design: glass morphism effects, gradient backgrounds, improved animations and hover effects
- July 02, 2025. Fixed authentication bug: password hashing now works correctly in createUser function, registration and login now work properly
- July 02, 2025. Added comprehensive data visualization to admin dashboard with Chart.js: revenue bar chart, room distribution doughnut chart, booking rate line chart, and new customers bar chart
- July 02, 2025. Fixed blog creation errors with auto-generated slugs from titles, resolved TypeScript filter issues
- July 02, 2025. Synchronized blog system: admin can create/edit blog posts with publish control, public blog page displays only published posts from API
- July 02, 2025. Added comprehensive booking management: admin now has dedicated "Đặt phòng" tab showing all customer bookings with details, status, and actions
- July 02, 2025. Fixed booking flow: customers now create bookings in database before payment, eliminating "booking not found" errors
- July 02, 2025. Added admin chat management: new "Tin nhắn" tab allows admin to view customer conversations and respond to messages in real-time
- July 02, 2025. Enhanced chat system with sender names: both admin and customer interfaces now display sender names (Admin or customer full name) above each message for better conversation clarity
- July 02, 2025. Improved booking conflict prevention: system now blocks double booking by checking both confirmed and pending bookings, preventing multiple users from booking the same room simultaneously
- July 03, 2025. Enhanced real-time chat system: reduced refresh interval to 0.5s, added optimistic updates for instant message display, implemented WebSocket notifications for real-time messaging
- July 03, 2025. Added comprehensive image management system: admin can upload multiple room images via URL, customers can view image galleries with thumbnails and navigation, rooms display preview images in booking interface
- July 03, 2025. Restructured payment system to deposit model: customers now pay 30% deposit at booking time and 70% remaining at check-in, added "deposit_paid" status, updated all interfaces to show deposit amounts and payment breakdown
- July 03, 2025. Added walk-in booking system: comprehensive 3-step process for front desk staff to handle customers arriving directly at hotel, includes customer verification, room selection, and mandatory 100% payment (no deposit option for walk-in customers)
- July 03, 2025. Optimized walk-in system for staff workflow: added clear instructions that front desk staff handle entire booking process for walk-in customers, added dedicated Walk-in tab in admin interface for easy access
- July 03, 2025. Enhanced booking management with payment transparency: admin can now see detailed payment status (pending/deposit paid/confirmed), payment amounts breakdown (30% deposit vs remaining 70%), payment methods, and visual indicators to track customer payment progress before room confirmation
- July 03, 2025. Fixed payment display accuracy: QR code and payment interface now correctly show 30% deposit amount instead of full room price, with clear breakdown showing remaining 70% for check-in payment
- July 03, 2025. Updated QR code image: replaced placeholder QR with custom pr.png image from client/src/assets, removed overlay text for cleaner display
- July 03, 2025. Implemented comprehensive feature enhancement package: Review & Rating System with 5-star ratings and detailed comments, Loyalty Program with Bronze/Silver/Gold/Platinum levels and point redemption, Promotional Code system with admin management and validation, Advanced Search with amenity filters and price ranges, Enhanced Email Templates with modern responsive design, and Multi-language Support (Vietnamese/English) with persistent language preferences
- July 03, 2025. Added check-in and check-out time selection to booking system: customers and walk-in staff can now specify exact times (default 14:00 check-in, 12:00 check-out), times display throughout all booking interfaces including customer portal, admin dashboard, and check-in system
- July 04, 2025. Implemented comprehensive Multi-language Support system: created i18n infrastructure with Zustand for state management, full Vietnamese and English translations for all interface elements, LanguageSelector component with flag icons and persistent language preferences, updated navigation and authentication components to use translation keys, supports 600+ translation keys covering all major features

## User Preferences

Preferred communication style: Simple, everyday language.