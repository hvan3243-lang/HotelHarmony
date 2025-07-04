# 🏨 HotelLux - Chạy Local với MySQL

## 📥 Tải và cài đặt

### 1. Tải code từ Replit
- Menu → "Download as ZIP"
- Giải nén vào thư mục Visual Studio Code

### 2. Sửa lỗi tự động

**Windows:**
```cmd
fix-errors.bat
```

**Linux/Mac:**
```bash
chmod +x fix-errors.sh
./fix-errors.sh
```

### 3. Cấu hình database
```bash
# Tạo database MySQL
mysql -u root -p -e "CREATE DATABASE hotellux;"

# Import data
mysql -u root -p hotellux < database_export.sql
```

### 4. Cấu hình .env
```env
DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/hotellux
JWT_SECRET=your-secret-key
```

### 5. Chạy ứng dụng
```bash
npm run dev
```

## 🔧 Các lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| `Cannot find module 'mysql2'` | Chưa cài MySQL driver | `npm install mysql2` |
| `pgTable is not defined` | Chưa đổi schema | Chạy `fix-errors.bat` |
| `Pool is not defined` | Chưa đổi db connection | Copy `server/db-mysql.ts` |
| `Access denied` | Password MySQL sai | Sửa `.env` file |
| `Port 5000 in use` | Port bị chiếm | `kill` process hoặc đổi port |

## 📁 Files quan trọng

- `fix-errors.bat/sh` - Script sửa lỗi tự động
- `database_export.sql` - Database schema + data
- `FIX_GUIDE.md` - Hướng dẫn sửa lỗi chi tiết
- `QUICK_START.md` - Hướng dẫn nhanh
- `shared/schema-mysql.ts` - Schema MySQL
- `server/db-mysql.ts` - Database connection MySQL

## 🎯 Tính năng đầy đủ

✅ Hệ thống đặt phòng
✅ Admin dashboard với charts
✅ Multi-language (Việt/Anh)
✅ Payment Stripe + QR
✅ Walk-in booking
✅ Real-time chat
✅ Loyalty program
✅ Review system
✅ Blog management
✅ Contact system

## 🔑 Login mặc định

- **Admin:** admin@hotellux.com / admin123
- **Customer:** Hoa1@gmail.com / customer123

## 📞 Hỗ trợ

Nếu vẫn gặp lỗi:
1. Đọc `FIX_GUIDE.md`
2. Chạy lại `fix-errors.bat`
3. Xóa `node_modules` và cài lại
4. Kiểm tra MySQL đang chạy