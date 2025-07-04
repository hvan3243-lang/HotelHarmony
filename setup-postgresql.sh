#!/bin/bash

echo "🐘 HotelLux - PostgreSQL Local Setup"
echo "===================================="

# Kiểm tra Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js chưa được cài đặt. Vui lòng cài đặt Node.js trước."
    exit 1
fi

# Kiểm tra PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL chưa được cài đặt."
    echo "🔧 Cài đặt PostgreSQL:"
    echo "   Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "   macOS: brew install postgresql && brew services start postgresql"
    echo "   Windows: Tải từ https://www.postgresql.org/download/windows/"
    exit 1
fi

echo "✅ Node.js và PostgreSQL đã sẵn sàng"

# Cài đặt dependencies
echo "📦 Cài đặt dependencies..."
npm install

# Tạo file .env nếu chưa có
if [ ! -f .env ]; then
    echo "📝 Tạo file .env..."
    
    # Tạo JWT secret ngẫu nhiên
    JWT_SECRET=$(openssl rand -hex 32)
    
    cat > .env << EOL
# PostgreSQL Database
DATABASE_URL=postgresql://hotellux_user:your_password@localhost:5432/hotellux

# JWT Secret
JWT_SECRET=$JWT_SECRET

# Stripe (tùy chọn)
STRIPE_SECRET_KEY=
VITE_STRIPE_PUBLIC_KEY=

# SendGrid (tùy chọn)
SENDGRID_API_KEY=
EOL
    echo "⚠️  Vui lòng cập nhật DATABASE_URL với thông tin PostgreSQL của bạn"
else
    echo "✅ File .env đã tồn tại"
fi

# Hướng dẫn tạo database
echo ""
echo "🗄️  Bước tiếp theo - Tạo database PostgreSQL:"
echo "1. Đăng nhập PostgreSQL: sudo -u postgres psql"
echo "2. Tạo database: CREATE DATABASE hotellux;"
echo "3. Tạo user: CREATE USER hotellux_user WITH PASSWORD 'your_password';"
echo "4. Cấp quyền: GRANT ALL PRIVILEGES ON DATABASE hotellux TO hotellux_user;"
echo "5. Thoát: \\q"
echo ""

# Hỏi có muốn tự động tạo database không
read -p "🤖 Bạn có muốn tự động tạo database không? (y/n): " create_db

if [ "$create_db" = "y" ] || [ "$create_db" = "Y" ]; then
    echo "🔑 Nhập password cho PostgreSQL user postgres:"
    read -s postgres_password
    
    echo "🔑 Nhập password cho user hotellux_user:"
    read -s hotellux_password
    
    # Tạo database và user
    echo "🗄️  Tạo database và user..."
    PGPASSWORD=$postgres_password psql -U postgres -h localhost << EOF
CREATE DATABASE hotellux;
CREATE USER hotellux_user WITH PASSWORD '$hotellux_password';
GRANT ALL PRIVILEGES ON DATABASE hotellux TO hotellux_user;
GRANT ALL ON SCHEMA public TO hotellux_user;
\q
EOF
    
    if [ $? -eq 0 ]; then
        echo "✅ Database đã được tạo thành công"
        
        # Cập nhật .env với password
        sed -i "s/your_password/$hotellux_password/g" .env
        echo "✅ File .env đã được cập nhật"
    else
        echo "❌ Lỗi tạo database. Vui lòng tạo thủ công theo hướng dẫn trên"
    fi
fi

# Chạy database migrations
echo "📋 Chạy database migrations..."
npm run db:push

if [ $? -eq 0 ]; then
    echo "✅ Database schema đã được tạo"
else
    echo "❌ Lỗi tạo schema. Kiểm tra DATABASE_URL trong .env"
fi

echo ""
echo "🎉 Setup hoàn tất!"
echo ""
echo "📋 Bước tiếp theo:"
echo "1. Kiểm tra file .env có đúng DATABASE_URL không"
echo "2. Chạy lệnh: npm run dev"
echo "3. Truy cập: http://localhost:5000"
echo ""
echo "🔑 Tạo admin user:"
echo "Truy cập trang đăng ký và tạo user với email admin@hotellux.com"
echo ""
echo "📚 Đọc thêm hướng dẫn trong file POSTGRESQL_LOCAL_SETUP.md"