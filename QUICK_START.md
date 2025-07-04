# 🚀 HotelLux - Hướng dẫn nhanh

## 📁 Các file quan trọng đã tạo:

1. **`database_export.sql`** - File SQL chứa toàn bộ schema và dữ liệu
2. **`LOCAL_SETUP_GUIDE.md`** - Hướng dẫn chi tiết cài đặt
3. **`package-mysql.json`** - Package.json cập nhật cho MySQL
4. **`setup-mysql.sh`** - Script tự động cho Linux/Mac
5. **`setup-mysql.bat`** - Script tự động cho Windows

## 🏃‍♂️ Cài đặt nhanh (3 phút):

### Bước 1: Tải code
- Trong Replit: Menu → "Download as ZIP"
- Giải nén vào thư mục của bạn

### Bước 2: Cài đặt MySQL
- Tải MySQL: https://dev.mysql.com/downloads/mysql/
- Cài đặt và nhớ password root

### Bước 3: Chạy script tự động

**Windows:**
```cmd
setup-mysql.bat
```

**Linux/Mac:**
```bash
./setup-mysql.sh
```

### Bước 4: Chạy ứng dụng
```bash
npm run dev
```

Truy cập: http://localhost:5000

## 🔑 Tài khoản mặc định:
- **Admin:** admin@hotellux.com (password: admin123)
- **Customer:** Hoa1@gmail.com

## 📋 Cấu trúc tính năng:

### 🏠 Trang chủ
- Hiển thị phòng nổi bật
- Chuyển đổi ngôn ngữ Việt/Anh
- Giao diện responsive

### 👤 Khách hàng
- Đăng ký/Đăng nhập
- Đặt phòng online
- Lịch sử đặt phòng
- Hệ thống loyalty points
- Chat với admin

### 👨‍💼 Quản trị viên
- Quản lý phòng (CRUD)
- Quản lý đặt phòng
- Thống kê doanh thu
- Quản lý dịch vụ
- Walk-in booking
- Chat với khách hàng

### 💳 Thanh toán
- Stripe integration
- QR code thanh toán
- Tiền đặt cọc 30%
- Thanh toán khi check-in 70%

### 🌐 Đa ngôn ngữ
- Tiếng Việt / English
- Lưu preference
- Tự động detect

## 🔧 Kỹ thuật:

### Frontend:
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion animations
- TanStack Query state management
- Wouter routing

### Backend:
- Node.js + Express
- MySQL database
- Drizzle ORM
- JWT authentication
- WebSocket real-time chat

### Database:
- 16 bảng chính
- Relationships đầy đủ
- JSON fields cho flexibility
- Indexes cho performance

## 📞 Hỗ trợ:

Nếu gặp vấn đề:
1. Đọc `LOCAL_SETUP_GUIDE.md` chi tiết
2. Kiểm tra MySQL đang chạy
3. Kiểm tra file `.env` đã đúng
4. Kiểm tra port 5000 có bị chiếm không

## 🚀 Deploy production:

```bash
# Build
npm run build

# Start production
npm start
```

**Chúc bạn thành công!** 🎉