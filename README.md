# 🏨 HotelLux - Hotel Management System

Modern hotel management application with booking system, admin dashboard, and multi-language support.

## 🚀 Quick Start (Local with PostgreSQL)

### 1. Download & Setup
```bash
# Download ZIP from Replit
# Extract to your project folder
cd hotellux
```

### 2. Auto Setup (Recommended)
**Windows:**
```cmd
setup-postgresql.bat
```

**Linux/Mac:**
```bash
./setup-postgresql.sh
```

### 3. Manual Setup
```bash
# Install dependencies
npm install

# Create .env file
DATABASE_URL=postgresql://user:password@localhost:5432/hotellux
JWT_SECRET=your-secret-key

# Create database
sudo -u postgres psql
CREATE DATABASE hotellux;
CREATE USER hotellux_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE hotellux TO hotellux_user;

# Run migrations
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
- **Backend:** Node.js, Express, PostgreSQL
- **Database:** Drizzle ORM
- **Auth:** JWT + bcrypt
- **Payments:** Stripe
- **Real-time:** WebSocket

## 📁 Project Structure
```
hotellux/
├── client/src/          # React frontend
├── server/              # Express backend  
├── shared/              # Shared types & schema
├── scripts/             # Database scripts
└── POSTGRESQL_LOCAL_SETUP.md  # Detailed setup guide
```

## 📚 Documentation
- `POSTGRESQL_LOCAL_SETUP.md` - Detailed local setup guide
- `replit.md` - Project architecture & changelog

## 🐘 Database Tools
```bash
npm run db:studio    # Drizzle Studio UI
npm run db:seed      # Insert sample data
npm run db:push      # Push schema changes
```

Built with ❤️ using modern web technologies.