# HotelLux - Visual Studio Code Setup

## Project Overview
HotelLux is a comprehensive hotel management system built with modern web technologies. This document provides setup instructions for Visual Studio Code development environment.

## Tech Stack
- **Frontend:** React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** MySQL with Drizzle ORM
- **Authentication:** JWT + Google OAuth
- **Payments:** Stripe integration
- **Real-time:** WebSocket for chat
- **Internationalization:** i18next (Vietnamese/English)

## Quick Start

### 1. Prerequisites
- Node.js 18+
- MySQL 8.0+
- Visual Studio Code

### 2. Installation
```bash
# Clone the repository
git clone [repository-url]
cd hotellux

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your database and API keys

# Setup database
npm run db:push
npm run seed

# Start development server
npm run dev
```

### 3. Database Configuration
Create MySQL database and user:
```sql
CREATE DATABASE hotellux;
CREATE USER 'hotellux'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON hotellux.* TO 'hotellux'@'localhost';
```

Update `.env` file:
```
DATABASE_URL=mysql://hotellux:your_password@localhost:3306/hotellux
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

## Features

### Core Features
- ✅ **Multi-language Support** - Vietnamese/English interface
- ✅ **Room Management** - CRUD operations for hotel rooms
- ✅ **Booking System** - Complete reservation management
- ✅ **Payment Integration** - Stripe + QR code payments
- ✅ **User Authentication** - JWT + Google OAuth
- ✅ **Admin Dashboard** - Analytics and management tools
- ✅ **Real-time Chat** - WebSocket-based messaging
- ✅ **Walk-in Booking** - Front desk customer handling
- ✅ **Review System** - Customer feedback and ratings
- ✅ **Loyalty Program** - Point system with tiers
- ✅ **Blog System** - Content management
- ✅ **Email Templates** - Automated notifications

### Advanced Features
- ✅ **Deposit System** - 30% deposit, 70% at check-in
- ✅ **Promotional Codes** - Discount management
- ✅ **Advanced Search** - Filter rooms by amenities
- ✅ **Time Selection** - Check-in/out time customization
- ✅ **Image Management** - Multiple room images
- ✅ **Contact System** - Customer inquiry management

## Project Structure

```
hotellux/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilities
├── server/              # Express backend
│   ├── services/        # Business logic
│   ├── db.ts           # Database connection
│   ├── storage.ts      # Database operations
│   └── routes.ts       # API endpoints
├── shared/              # Shared types/schemas
│   └── schema.ts       # Database schema
└── scripts/            # Utility scripts
```

## Development Workflow

### Database Operations
```bash
# Push schema changes
npm run db:push

# Seed database with sample data
npm run seed

# View database in browser
npm run db:studio
```

### Available Scripts
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run seed       # Seed database
npm run db:push    # Push schema changes
npm run db:studio  # Open database studio
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/google` - Google OAuth login

### Rooms
- `GET /api/rooms` - Get all rooms
- `POST /api/rooms` - Create room (admin)
- `PUT /api/rooms/:id` - Update room (admin)
- `DELETE /api/rooms/:id` - Delete room (admin)

### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id/cancel` - Cancel booking
- `PUT /api/bookings/:id/confirm` - Confirm booking (admin)

### Payment
- `POST /api/create-payment-intent` - Create Stripe payment
- `POST /api/confirm-payment` - Confirm payment

## Visual Studio Code Configuration

### Recommended Extensions
- **MySQL** (cweijan) - Database management
- **Prettier** - Code formatting
- **ESLint** - Code linting
- **TypeScript Importer** - Auto imports
- **Tailwind CSS IntelliSense** - CSS utilities

### Settings
The project includes `.vscode/settings.json` with optimized configuration for TypeScript, formatting, and Tailwind CSS.

## Testing

### User Accounts (after seeding)
- **Admin:** admin@hotellux.com / admin123
- **Customer:** customer@hotellux.com / customer123

### Test Data
The seed script creates:
- 4 sample rooms (Standard, Deluxe, Suite, Presidential)
- 5 hotel services
- Sample blog posts
- Promotional codes

## Deployment

### Environment Variables
```
DATABASE_URL=mysql://user:pass@host:port/db
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
SENDGRID_API_KEY=your_sendgrid_api_key
```

### Production Build
```bash
npm run build
npm start
```

## Support

For issues or questions:
1. Check the database connection in `.env`
2. Verify MySQL service is running
3. Ensure all dependencies are installed
4. Check the console for error messages

## Recent Updates
- Migrated from PostgreSQL to MySQL
- Added Visual Studio Code configuration
- Enhanced development workflow
- Updated documentation for local development