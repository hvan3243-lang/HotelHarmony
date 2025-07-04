# 🐘 HotelLux - Chạy Local với PostgreSQL

## 📥 Tải và cài đặt

### 1. Tải code từ Replit
- Menu → "Download as ZIP" 
- Giải nén vào thư mục Visual Studio Code

### 2. Cài đặt PostgreSQL
```bash
# Windows (sử dụng PostgreSQL installer)
# Tải từ: https://www.postgresql.org/download/windows/

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql
```

### 3. Tạo database
```bash
# Đăng nhập PostgreSQL
sudo -u postgres psql

# Tạo database và user
CREATE DATABASE hotellux;
CREATE USER hotellux_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE hotellux TO hotellux_user;
\q
```

### 4. Cài đặt dependencies
```bash
npm install
```

### 5. Cấu hình .env
Tạo file `.env`:
```env
# PostgreSQL Database
DATABASE_URL=postgresql://hotellux_user:your_password@localhost:5432/hotellux

# JWT Secret  
JWT_SECRET=your-super-secret-jwt-key-here

# Stripe (tùy chọn)
STRIPE_SECRET_KEY=
VITE_STRIPE_PUBLIC_KEY=

# SendGrid (tùy chọn)
SENDGRID_API_KEY=
```

### 6. Chạy migrations
```bash
# Tạo tables
npm run db:push

# Hoặc sử dụng migrations
npm run db:generate
npm run db:migrate
```

### 7. Seed dữ liệu (tùy chọn)
Tạo file `scripts/seed.ts`:
```typescript
import { db } from '../server/db.js';
import { users, rooms } from '../shared/schema.js';
import bcrypt from 'bcrypt';

async function seed() {
  // Tạo admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await db.insert(users).values({
    email: 'admin@hotellux.com',
    password: hashedPassword,
    firstName: 'Admin',
    lastName: 'User',
    phone: '+1-555-0100',
    role: 'admin',
    preferences: ['luxury', 'spa'],
    isVip: false
  });

  // Tạo sample rooms
  await db.insert(rooms).values([
    {
      number: '101',
      type: 'suite',
      price: '200.00',
      capacity: 3,
      amenities: [],
      images: [
        'https://images.unsplash.com/photo-1540518614846-7eded1dcaeb6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        'https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
      ],
      status: 'available',
      description: 'Luxury suite with ocean view'
    },
    {
      number: '102', 
      type: 'deluxe',
      price: '150.00',
      capacity: 2,
      amenities: [],
      images: [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
      ],
      status: 'available',
      description: 'Deluxe room with city view'
    }
  ]);

  console.log('✅ Seed data inserted successfully!');
}

seed().catch(console.error);
```

Chạy seed:
```bash
npm run db:seed
```

### 8. Chạy ứng dụng
```bash
npm run dev
```

Truy cập: http://localhost:5000

## 🔑 Tài khoản mặc định

- **Admin:** admin@hotellux.com / admin123
- **Customer:** (tạo qua trang đăng ký)

## 🔧 Troubleshooting

### Lỗi kết nối PostgreSQL
```bash
# Kiểm tra PostgreSQL đang chạy
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # Mac

# Restart PostgreSQL
sudo systemctl restart postgresql  # Linux  
brew services restart postgresql  # Mac
```

### Lỗi permission
```bash
# Cấp quyền cho user
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE hotellux TO hotellux_user;
GRANT ALL ON SCHEMA public TO hotellux_user;
\q
```

### Reset database
```bash
# Xóa tất cả tables
npm run db:drop

# Tạo lại
npm run db:push
npm run db:seed
```

## 📊 Database Tools

### Drizzle Studio (Recommended)
```bash
npm run db:studio
```
Truy cập: http://localhost:4983

### pgAdmin
- Tải từ: https://www.pgadmin.org/
- Kết nối với thông tin trong `.env`

### Command Line
```bash
# Kết nối trực tiếp
psql postgresql://hotellux_user:your_password@localhost:5432/hotellux

# Xem tables
\dt

# Xem data
SELECT * FROM users;
SELECT * FROM rooms;
```

## 🚀 Production Deployment

### Heroku
```bash
# Thêm PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET=your-secret
heroku config:set STRIPE_SECRET_KEY=your-stripe-key

# Deploy
git push heroku main
```

### Vercel + Neon
```bash
# Tạo database tại neon.tech
# Cập nhật .env với DATABASE_URL từ Neon
# Deploy lên Vercel
```

## 📋 Cấu trúc Database

Hệ thống sử dụng 16 bảng chính:
- `users` - Người dùng và admin
- `rooms` - Phòng khách sạn  
- `bookings` - Đặt phòng
- `services` - Dịch vụ
- `blog_posts` - Blog
- `reviews` - Đánh giá
- `chat_messages` - Tin nhắn
- `contact_messages` - Liên hệ
- `loyalty_points` - Điểm thưởng
- `promotional_codes` - Mã giảm giá
- Và 6 bảng hỗ trợ khác

## 🎯 Tính năng đầy đủ

✅ Hệ thống đặt phòng hoàn chỉnh
✅ Admin dashboard với biểu đồ
✅ Đa ngôn ngữ (Việt/Anh)  
✅ Thanh toán Stripe + QR
✅ Walk-in booking
✅ Chat real-time
✅ Loyalty program
✅ Review system
✅ Blog management
✅ Contact system

Project hoạt động đầy đủ với PostgreSQL như trên Replit!