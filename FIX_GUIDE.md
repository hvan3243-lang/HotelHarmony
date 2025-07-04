# 🔧 Hướng dẫn sửa lỗi khi chạy HotelLux Local

## 🚨 Các lỗi phổ biến và cách sửa:

### 1. Lỗi Database Connection (MySQL)

**Lỗi:** `Cannot find module 'mysql2/promise'`

**Sửa:**
```bash
npm uninstall @neondatabase/serverless
npm install mysql2
npm install drizzle-orm
```

### 2. Lỗi Schema

**Lỗi:** `pgTable is not defined`

**Sửa:** Thay file `shared/schema.ts` bằng `shared/schema-mysql.ts`:
```bash
cp shared/schema-mysql.ts shared/schema.ts
```

### 3. Lỗi Database Connection File

**Lỗi:** `Pool is not defined`

**Sửa:** Thay file `server/db.ts` bằng `server/db-mysql.ts`:
```bash
cp server/db-mysql.ts server/db.ts
```

### 4. Lỗi Drizzle Config

**Lỗi:** `dialect: 'postgresql' is not supported`

**Sửa:** Thay file `drizzle.config.ts` bằng `drizzle-mysql.config.ts`:
```bash
cp drizzle-mysql.config.ts drizzle.config.ts
```

### 5. Lỗi Environment Variables

**Lỗi:** `DATABASE_URL is not defined`

**Sửa:** Tạo file `.env`:
```env
DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/hotellux
JWT_SECRET=your-secret-key-here
STRIPE_SECRET_KEY=
VITE_STRIPE_PUBLIC_KEY=
SENDGRID_API_KEY=
```

### 6. Lỗi TypeScript Config

**Lỗi:** `Top-level 'await' expressions are only allowed...`

**Sửa:** Cập nhật `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["client/src", "server", "shared"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 7. Lỗi Package.json

**Lỗi:** `Script dev not found`

**Sửa:** Thay file `package.json` bằng `package-mysql.json`:
```bash
cp package-mysql.json package.json
```

### 8. Lỗi Port đã được sử dụng

**Lỗi:** `Port 5000 is already in use`

**Sửa:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

### 9. Lỗi MySQL không kết nối được

**Lỗi:** `Access denied for user 'root'@'localhost'`

**Sửa:**
```bash
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

### 10. Lỗi Missing Dependencies

**Lỗi:** `Module not found: Can't resolve...`

**Sửa:**
```bash
npm install
npm install @types/mysql2
npm install concurrently
```

## 🚀 Script sửa lỗi tự động:

### Windows (fix-errors.bat):
```batch
@echo off
echo 🔧 Sửa lỗi tự động...

REM Cài đặt đúng dependencies
call npm uninstall @neondatabase/serverless
call npm install mysql2 drizzle-orm @types/mysql2 concurrently

REM Sao chép file đúng
copy shared\schema-mysql.ts shared\schema.ts
copy server\db-mysql.ts server\db.ts
copy drizzle-mysql.config.ts drizzle.config.ts
copy package-mysql.json package.json

REM Cài đặt lại
call npm install

echo ✅ Hoàn thành! Chạy: npm run dev
pause
```

### Linux/Mac (fix-errors.sh):
```bash
#!/bin/bash
echo "🔧 Sửa lỗi tự động..."

# Cài đặt đúng dependencies
npm uninstall @neondatabase/serverless
npm install mysql2 drizzle-orm @types/mysql2 concurrently

# Sao chép file đúng
cp shared/schema-mysql.ts shared/schema.ts
cp server/db-mysql.ts server/db.ts
cp drizzle-mysql.config.ts drizzle.config.ts
cp package-mysql.json package.json

# Cài đặt lại
npm install

echo "✅ Hoàn thành! Chạy: npm run dev"
```

## 📋 Checklist sửa lỗi:

- [ ] Cài đặt MySQL và tạo database `hotellux`
- [ ] Tạo file `.env` với thông tin đúng
- [ ] Chạy script `fix-errors.bat` (Windows) hoặc `fix-errors.sh` (Linux/Mac)
- [ ] Import database: `mysql -u root -p hotellux < database_export.sql`
- [ ] Chạy: `npm run dev`
- [ ] Kiểm tra: http://localhost:5000

## 🔑 Tài khoản test:

- **Admin:** admin@hotellux.com / password: admin123
- **Customer:** Hoa1@gmail.com / password: customer123

## 📞 Nếu vẫn lỗi:

1. Kiểm tra MySQL đang chạy: `systemctl status mysql`
2. Kiểm tra Node.js version: `node --version` (cần >= 18)
3. Xóa node_modules và cài lại: `rm -rf node_modules && npm install`
4. Kiểm tra port 5000: `netstat -an | grep 5000`

**Lưu ý:** Hầu hết lỗi đều do chưa chuyển đổi từ PostgreSQL sang MySQL đúng cách. Chạy script fix-errors sẽ sửa được 90% lỗi.