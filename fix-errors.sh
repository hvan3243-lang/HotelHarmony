#!/bin/bash

echo "🔧 Sửa lỗi tự động cho HotelLux MySQL..."

# Xóa node_modules cũ
if [ -d "node_modules" ]; then
    echo "🗑️  Xóa node_modules cũ..."
    rm -rf node_modules
fi

# Cài đặt đúng dependencies
echo "📦 Cài đặt dependencies..."
npm uninstall @neondatabase/serverless
npm install mysql2 drizzle-orm @types/mysql2 concurrently

# Sao chép file đúng
echo "📋 Cập nhật schema và config..."
if [ -f "shared/schema-mysql.ts" ]; then
    cp shared/schema-mysql.ts shared/schema.ts
fi

if [ -f "server/db-mysql.ts" ]; then
    cp server/db-mysql.ts server/db.ts
fi

if [ -f "drizzle-mysql.config.ts" ]; then
    cp drizzle-mysql.config.ts drizzle.config.ts
fi

if [ -f "package-mysql.json" ]; then
    cp package-mysql.json package.json
fi

# Cài đặt lại tất cả dependencies
echo "📦 Cài đặt lại dependencies..."
npm install

# Tạo file .env nếu chưa có
if [ ! -f ".env" ]; then
    echo "📝 Tạo file .env..."
    cat > .env << 'EOL'
# Database MySQL
DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/hotellux

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Stripe (tùy chọn)
STRIPE_SECRET_KEY=
VITE_STRIPE_PUBLIC_KEY=

# SendGrid (tùy chọn)
SENDGRID_API_KEY=
EOL
    echo "⚠️  Nhớ sửa YOUR_PASSWORD trong file .env"
fi

echo ""
echo "✅ Sửa lỗi hoàn tất!"
echo ""
echo "📋 Bước tiếp theo:"
echo "1. Sửa file .env với password MySQL đúng"
echo "2. Chạy: mysql -u root -p hotellux < database_export.sql"
echo "3. Chạy: npm run dev"
echo "4. Truy cập: http://localhost:5000"
echo ""