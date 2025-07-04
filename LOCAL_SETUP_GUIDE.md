# HotelLux - Hướng dẫn cài đặt Local với MySQL

## Yêu cầu hệ thống
- Node.js v18 trở lên
- MySQL v8.0 trở lên
- Git (tùy chọn)

## Bước 1: Tải code về máy

### Cách 1: Tải ZIP
1. Trong Replit, nhấn menu (3 dấu chấm) → "Download as ZIP"
2. Giải nén file zip vào thư mục của bạn
3. Mở terminal/cmd tại thư mục đó

### Cách 2: Clone Git (nếu có)
```bash
git clone <repository-url>
cd hotellux
```

## Bước 2: Cài đặt MySQL Database

### Cài đặt MySQL
1. Tải MySQL từ: https://dev.mysql.com/downloads/mysql/
2. Cài đặt theo hướng dẫn
3. Nhớ password của user root

### Tạo Database
1. Mở MySQL Command Line hoặc MySQL Workbench
2. Chạy lệnh:
```sql
CREATE DATABASE hotellux;
```

3. Import schema từ file `database_export.sql`:
```bash
mysql -u root -p hotellux < database_export.sql
```

## Bước 3: Cài đặt Node.js dependencies

```bash
npm install
```

## Bước 4: Cấu hình Environment Variables

Tạo file `.env` trong thư mục root:

```env
# Database MySQL
DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/hotellux

# JWT Secret (tạo chuỗi ngẫu nhiên)
JWT_SECRET=your-super-secret-jwt-key-here-change-this

# Stripe (tùy chọn - để trống nếu không cần)
STRIPE_SECRET_KEY=
VITE_STRIPE_PUBLIC_KEY=

# SendGrid (tùy chọn - để trống nếu không cần)
SENDGRID_API_KEY=
```

**Lưu ý:** Thay `YOUR_PASSWORD` bằng password MySQL của bạn

## Bước 5: Cài đặt MySQL Driver

Vì project hiện tại dùng PostgreSQL, bạn cần thay đổi để dùng MySQL:

```bash
npm uninstall @neondatabase/serverless
npm install mysql2
```

## Bước 6: Cập nhật Drizzle Config

Sửa file `drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'mysql',
  schema: './shared/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## Bước 7: Cập nhật Database Connection

Sửa file `server/db.ts`:

```typescript
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../shared/schema.js';

const connection = await mysql.createConnection({
  uri: process.env.DATABASE_URL!,
});

export const db = drizzle(connection, { schema });
```

## Bước 8: Cập nhật Schema cho MySQL

Sửa file `shared/schema.ts` - thay đổi imports:

```typescript
import { mysqlTable, text, int, boolean, timestamp, decimal, json, varchar } from "drizzle-orm/mysql-core";

// Thay đổi tất cả pgTable thành mysqlTable
// Thay đổi serial thành int auto_increment
// Ví dụ:
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  // ... rest of fields
});
```

## Bước 9: Chạy ứng dụng

```bash
npm run dev
```

Truy cập: http://localhost:5000

## Bước 10: Tạo dữ liệu mẫu (tùy chọn)

Nếu muốn tạo thêm dữ liệu mẫu:

```sql
-- Thêm phòng mẫu
INSERT INTO rooms (number, type, price, capacity, status, description) VALUES
('201', 'deluxe', 150.00, 2, 'available', 'Phòng deluxe view biển'),
('301', 'standard', 100.00, 2, 'available', 'Phòng standard tiêu chuẩn'),
('401', 'presidential', 500.00, 4, 'available', 'Phòng tổng thống cao cấp');

-- Thêm dịch vụ
INSERT INTO services (name, description, price, category, is_active) VALUES
('Spa massage', 'Dịch vụ massage thư giãn', 80.00, 'spa', TRUE),
('Breakfast', 'Bữa sáng buffet', 25.00, 'food', TRUE),
('Airport pickup', 'Đưa đón sân bay', 30.00, 'transport', TRUE);
```

## Troubleshooting

### Lỗi kết nối MySQL
```bash
# Kiểm tra MySQL đang chạy
sudo systemctl status mysql  # Linux
brew services list | grep mysql  # Mac

# Restart MySQL
sudo systemctl restart mysql  # Linux
brew services restart mysql  # Mac
```

### Lỗi permission
```bash
# Tạo user MySQL mới
mysql -u root -p
CREATE USER 'hotellux'@'localhost' IDENTIFIED BY 'password123';
GRANT ALL PRIVILEGES ON hotellux.* TO 'hotellux'@'localhost';
FLUSH PRIVILEGES;

# Cập nhật DATABASE_URL
DATABASE_URL=mysql://hotellux:password123@localhost:3306/hotellux
```

### Lỗi port đã được sử dụng
```bash
# Tìm process đang dùng port 5000
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Kill process
kill -9 <PID>
```

## Tài khoản mặc định

- **Admin:** admin@hotellux.com / password: admin123
- **Customer:** Hoa1@gmail.com / password: (xem trong database)

## Cấu trúc thư mục

```
hotellux/
├── client/          # Frontend React
├── server/          # Backend Express
├── shared/          # Schema chung
├── database_export.sql  # SQL export
├── LOCAL_SETUP_GUIDE.md # Hướng dẫn này
└── package.json
```

## Lệnh hữu ích

```bash
# Chạy development
npm run dev

# Build production
npm run build

# Chạy production
npm start

# Reset database
mysql -u root -p hotellux < database_export.sql
```

## Liên hệ hỗ trợ

Nếu gặp vấn đề, vui lòng tạo issue hoặc liên hệ qua email.