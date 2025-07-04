@echo off
echo 🏨 HotelLux - MySQL Setup Script for Windows
echo ============================================

REM Kiểm tra Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js chưa được cài đặt. Vui lòng cài đặt Node.js trước.
    pause
    exit /b 1
)

REM Kiểm tra MySQL
where mysql >nul 2>&1
if errorlevel 1 (
    echo ❌ MySQL chưa được cài đặt. Vui lòng cài đặt MySQL trước.
    pause
    exit /b 1
)

echo ✅ Node.js và MySQL đã sẵn sàng

REM Cài đặt dependencies
echo 📦 Cài đặt dependencies...
call npm install

REM Cài đặt MySQL driver
echo 🔧 Cài đặt MySQL driver...
call npm uninstall @neondatabase/serverless
call npm install mysql2

REM Tạo file .env nếu chưa có
if not exist .env (
    echo 📝 Tạo file .env...
    (
        echo # Database MySQL - Thay đổi password của bạn
        echo DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/hotellux
        echo.
        echo # JWT Secret - Thay đổi thành chuỗi ngẫu nhiên
        echo JWT_SECRET=your-super-secret-jwt-key-here-change-this
        echo.
        echo # Stripe ^(tùy chọn^)
        echo STRIPE_SECRET_KEY=
        echo VITE_STRIPE_PUBLIC_KEY=
        echo.
        echo # SendGrid ^(tùy chọn^)
        echo SENDGRID_API_KEY=
    ) > .env
    echo ⚠️  Vui lòng sửa file .env và thay đổi YOUR_PASSWORD thành password MySQL của bạn
) else (
    echo ✅ File .env đã tồn tại
)

REM Nhập password MySQL
set /p mysql_password=🔑 Nhập password MySQL để tạo database: 

REM Tạo database
echo 🗄️  Tạo database...
mysql -u root -p%mysql_password% -e "CREATE DATABASE IF NOT EXISTS hotellux;"

if errorlevel 1 (
    echo ❌ Lỗi tạo database. Vui lòng kiểm tra password MySQL
    pause
    exit /b 1
)

echo ✅ Database đã được tạo thành công

REM Import schema
echo 📋 Import database schema...
mysql -u root -p%mysql_password% hotellux < database_export.sql

if errorlevel 1 (
    echo ❌ Lỗi import schema
    pause
    exit /b 1
)

echo ✅ Schema đã được import thành công

REM Cập nhật DATABASE_URL trong .env
powershell -Command "(Get-Content .env) -replace 'YOUR_PASSWORD', '%mysql_password%' | Set-Content .env"

echo.
echo 🎉 Setup hoàn tất!
echo.
echo 📋 Bước tiếp theo:
echo 1. Kiểm tra file .env và cập nhật các thông tin cần thiết
echo 2. Chạy lệnh: npm run dev
echo 3. Truy cập: http://localhost:5000
echo.
echo 🔑 Tài khoản mặc định:
echo Admin: admin@hotellux.com / password: admin123
echo Customer: Hoa1@gmail.com / password: (xem trong database)
echo.
echo 📚 Đọc thêm hướng dẫn trong file LOCAL_SETUP_GUIDE.md
pause