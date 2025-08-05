# 🏨 HotelLux - Hotel Management System

Modern hotel management application with booking system, admin dashboard, and multi-language support.

## 🚀 Quick Start (Local with MySQL)

### 1. Download & Setup

```bash
# Download ZIP from Replit
# Extract to your project folder
cd hotelharmony
```

### 2. MySQL Setup

**Tạo database và user MySQL:**

```sql
CREATE DATABASE hotelharmony;
CREATE USER 'hotel_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON hotelharmony.* TO 'hotel_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Manual Setup

```bash
# Install dependencies
npm install

# Tạo file .env
DATABASE_URL=mysql://hotel_user:your_password@localhost:3306/hotelharmony
JWT_SECRET=your-secret-key

# Chạy migrate
npm run db:push

# Seed sample data
npm run db:seed
```

### 4. Run Application

```bash
npm run dev
```

Visit: http://localhost:5000

## 🔑 Default Accounts

- **Admin:** admin@hotellux.com / admin123
- **Customer:** customer@hotellux.com / customer123

## 📋 Features

- ✅ Room booking system
- ✅ Admin dashboard with analytics
- ✅ Multi-language (Vietnamese/English)
- ✅ Stripe payment integration
- ✅ Walk-in booking for front desk
- ✅ Real-time chat system
- ✅ Loyalty program
- ✅ Review & rating system
- ✅ Blog management
- ✅ Contact system

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, MySQL
- **Database:** Drizzle ORM
- **Auth:** JWT + bcrypt
- **Payments:** Stripe
- **Real-time:** WebSocket

## 📁 Project Structure

```
hotelharmony/
├── client/src/          # React frontend
├── server/              # Express backend
├── shared/              # Shared types & schema
├── scripts/             # Database scripts
└── MYSQL_SETUP.md       # Detailed setup guide
```

## 📚 Documentation

- `MYSQL_SETUP.md` - Detailed local setup guide for MySQL
- `replit.md` - Project architecture & changelog

## 🐬 Database Tools

```bash
npm run db:studio    # Drizzle Studio UI
npm run db:seed      # Insert sample data
npm run db:push      # Push schema changes
```

Built with ❤️ using modern web technologies.
