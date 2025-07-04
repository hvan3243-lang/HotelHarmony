@echo off
echo 🐘 HotelLux - PostgreSQL Local Setup for Windows
echo ================================================

REM Kiểm tra Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js chưa được cài đặt. Vui lòng cài đặt Node.js trước.
    pause
    exit /b 1
)

REM Kiểm tra PostgreSQL
where psql >nul 2>&1
if errorlevel 1 (
    echo ❌ PostgreSQL chưa được cài đặt.
    echo 🔧 Cài đặt PostgreSQL:
    echo    Tải từ: https://www.postgresql.org/download/windows/
    echo    Hoặc sử dụng chocolatey: choco install postgresql
    pause
    exit /b 1
)

echo ✅ Node.js và PostgreSQL đã sẵn sàng

REM Cài đặt dependencies
echo 📦 Cài đặt dependencies...
call npm install

REM Tạo file .env nếu chưa có
if not exist .env (
    echo 📝 Tạo file .env...
    (
        echo # PostgreSQL Database
        echo DATABASE_URL=postgresql://hotellux_user:your_password@localhost:5432/hotellux
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
    echo ⚠️  Vui lòng cập nhật DATABASE_URL với thông tin PostgreSQL của bạn
) else (
    echo ✅ File .env đã tồn tại
)

echo.
echo 🗄️  Bước tiếp theo - Tạo database PostgreSQL:
echo 1. Mở Command Prompt với quyền Administrator
echo 2. Đăng nhập: psql -U postgres
echo 3. Tạo database: CREATE DATABASE hotellux;
echo 4. Tạo user: CREATE USER hotellux_user WITH PASSWORD 'your_password';
echo 5. Cấp quyền: GRANT ALL PRIVILEGES ON DATABASE hotellux TO hotellux_user;
echo 6. Thoát: \q
echo.

set /p create_db=🤖 Bạn có muốn tự động tạo database không? (y/n): 

if /i "%create_db%"=="y" (
    set /p postgres_password=🔑 Nhập password cho PostgreSQL user postgres: 
    set /p hotellux_password=🔑 Nhập password cho user hotellux_user: 
    
    echo 🗄️  Tạo database và user...
    set PGPASSWORD=%postgres_password%
    psql -U postgres -h localhost -c "CREATE DATABASE hotellux; CREATE USER hotellux_user WITH PASSWORD '%hotellux_password%'; GRANT ALL PRIVILEGES ON DATABASE hotellux TO hotellux_user; GRANT ALL ON SCHEMA public TO hotellux_user;"
    
    if not errorlevel 1 (
        echo ✅ Database đã được tạo thành công
        REM Cập nhật .env với password
        powershell -Command "(Get-Content .env) -replace 'your_password', '%hotellux_password%' | Set-Content .env"
        echo ✅ File .env đã được cập nhật
    ) else (
        echo ❌ Lỗi tạo database. Vui lòng tạo thủ công theo hướng dẫn trên
    )
)

REM Chạy database migrations
echo 📋 Chạy database migrations...
call npm run db:push

if not errorlevel 1 (
    echo ✅ Database schema đã được tạo
) else (
    echo ❌ Lỗi tạo schema. Kiểm tra DATABASE_URL trong .env
)

echo.
echo 🎉 Setup hoàn tất!
echo.
echo 📋 Bước tiếp theo:
echo 1. Kiểm tra file .env có đúng DATABASE_URL không
echo 2. Chạy lệnh: npm run dev
echo 3. Truy cập: http://localhost:5000
echo.
echo 🔑 Tạo admin user:
echo Truy cập trang đăng ký và tạo user với email admin@hotellux.com
echo.
echo 📚 Đọc thêm hướng dẫn trong file POSTGRESQL_LOCAL_SETUP.md
pause