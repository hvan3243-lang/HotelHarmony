#!/bin/bash

echo "🏨 HotelLux - MySQL Setup Script"
echo "================================="

# Kiểm tra Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js chưa được cài đặt. Vui lòng cài đặt Node.js trước."
    exit 1
fi

# Kiểm tra MySQL
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL chưa được cài đặt. Vui lòng cài đặt MySQL trước."
    exit 1
fi

echo "✅ Node.js và MySQL đã sẵn sàng"

# Cài đặt dependencies
echo "📦 Cài đặt dependencies..."
npm install

# Cài đặt MySQL driver
echo "🔧 Cài đặt MySQL driver..."
npm uninstall @neondatabase/serverless
npm install mysql2

# Tạo file .env nếu chưa có
if [ ! -f .env ]; then
    echo "📝 Tạo file .env..."
    cat > .env << EOL
# Database MySQL - Thay đổi password của bạn
DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/hotellux

# JWT Secret - Thay đổi thành chuỗi ngẫu nhiên
JWT_SECRET=your-super-secret-jwt-key-here-change-this-$(openssl rand -hex 32)

# Stripe (tùy chọn)
STRIPE_SECRET_KEY=
VITE_STRIPE_PUBLIC_KEY=

# SendGrid (tùy chọn)
SENDGRID_API_KEY=
EOL
    echo "⚠️  Vui lòng sửa file .env và thay đổi YOUR_PASSWORD thành password MySQL của bạn"
else
    echo "✅ File .env đã tồn tại"
fi

# Nhập password MySQL
echo "🔑 Nhập password MySQL để tạo database:"
read -s mysql_password

# Tạo database
echo "🗄️  Tạo database..."
mysql -u root -p$mysql_password -e "CREATE DATABASE IF NOT EXISTS hotellux;"

if [ $? -eq 0 ]; then
    echo "✅ Database đã được tạo thành công"
else
    echo "❌ Lỗi tạo database. Vui lòng kiểm tra password MySQL"
    exit 1
fi

# Import schema
echo "📋 Import database schema..."
mysql -u root -p$mysql_password hotellux < database_export.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema đã được import thành công"
else
    echo "❌ Lỗi import schema"
    exit 1
fi

# Cập nhật DATABASE_URL trong .env
sed -i "s/YOUR_PASSWORD/$mysql_password/g" .env

echo ""
echo "🎉 Setup hoàn tất!"
echo ""
echo "📋 Bước tiếp theo:"
echo "1. Kiểm tra file .env và cập nhật các thông tin cần thiết"
echo "2. Chạy lệnh: npm run dev"
echo "3. Truy cập: http://localhost:5000"
echo ""
echo "🔑 Tài khoản mặc định:"
echo "Admin: admin@hotellux.com / password: admin123"
echo "Customer: Hoa1@gmail.com / password: (xem trong database)"
echo ""
echo "📚 Đọc thêm hướng dẫn trong file LOCAL_SETUP_GUIDE.md"