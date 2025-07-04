@echo off
echo 🔧 Sửa lỗi tự động cho HotelLux MySQL...

REM Xóa node_modules cũ
if exist node_modules rmdir /s /q node_modules

REM Cài đặt đúng dependencies
echo 📦 Cài đặt dependencies...
call npm uninstall @neondatabase/serverless
call npm install mysql2 drizzle-orm @types/mysql2 concurrently

REM Sao chép file đúng
echo 📋 Cập nhật schema và config...
if exist shared\schema-mysql.ts copy shared\schema-mysql.ts shared\schema.ts
if exist server\db-mysql.ts copy server\db-mysql.ts server\db.ts
if exist drizzle-mysql.config.ts copy drizzle-mysql.config.ts drizzle.config.ts
if exist package-mysql.json copy package-mysql.json package.json

REM Cài đặt lại tất cả dependencies
echo 📦 Cài đặt lại dependencies...
call npm install

REM Tạo file .env nếu chưa có
if not exist .env (
    echo 📝 Tạo file .env...
    (
        echo # Database MySQL
        echo DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/hotellux
        echo.
        echo # JWT Secret
        echo JWT_SECRET=your-super-secret-jwt-key-here
        echo.
        echo # Stripe ^(tùy chọn^)
        echo STRIPE_SECRET_KEY=
        echo VITE_STRIPE_PUBLIC_KEY=
        echo.
        echo # SendGrid ^(tùy chọn^)
        echo SENDGRID_API_KEY=
    ) > .env
    echo ⚠️  Nhớ sửa YOUR_PASSWORD trong file .env
)

echo.
echo ✅ Sửa lỗi hoàn tất!
echo.
echo 📋 Bước tiếp theo:
echo 1. Sửa file .env với password MySQL đúng
echo 2. Chạy: mysql -u root -p hotellux ^< database_export.sql
echo 3. Chạy: npm run dev
echo 4. Truy cập: http://localhost:5000
echo.
pause