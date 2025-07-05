# Environment Variables Setup Guide

## Replit Environment Variables

Trong Replit, vào tab **Secrets** và thêm các biến môi trường sau:

### 1. Database (Tự động có sẵn)
```
DATABASE_URL=postgresql://... (tự động tạo)
PGHOST=... (tự động tạo)
PGPORT=... (tự động tạo)
PGDATABASE=... (tự động tạo)
PGUSER=... (tự động tạo)
PGPASSWORD=... (tự động tạo)
```

### 2. Authentication Keys
```
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
SESSION_SECRET=your-session-secret-key-at-least-32-characters-long
```

### 3. Google OAuth
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 4. Payment Integration
```
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
VITE_STRIPE_PUBLIC_KEY=pk_test_your-stripe-public-key
```

### 5. Email Service
```
SENDGRID_API_KEY=SG.your-sendgrid-api-key
```

## Local Development (.env file)

Tạo file `.env` trong thư mục gốc:

```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/hotellux
PGHOST=localhost
PGPORT=5432
PGDATABASE=hotellux
PGUSER=postgres
PGPASSWORD=your_password

# Authentication
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
SESSION_SECRET=your-session-secret-key-at-least-32-characters-long

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Payment Integration
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
VITE_STRIPE_PUBLIC_KEY=pk_test_your-stripe-public-key

# Email Service
SENDGRID_API_KEY=SG.your-sendgrid-api-key

# Development
NODE_ENV=development
PORT=5000
```

## Cách lấy API Keys

### Google OAuth
1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project > APIs & Services > Credentials
3. Tạo OAuth 2.0 Client ID
4. Copy Client ID và Client Secret

### Stripe
1. Vào [Stripe Dashboard](https://dashboard.stripe.com/)
2. Vào Developers > API keys
3. Copy Publishable key và Secret key

### SendGrid
1. Vào [SendGrid](https://sendgrid.com/)
2. Vào Settings > API Keys
3. Tạo API key mới
4. Copy API key

## Tạo Strong Secrets

Để tạo JWT_SECRET và SESSION_SECRET mạnh:

```bash
# Sử dụng Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Hoặc sử dụng OpenSSL
openssl rand -hex 32
```

## Kiểm tra Environment Variables

Khi chạy server, sẽ có thông báo về các biến môi trường:

```
✅ Database: Connected
✅ JWT: Configured
✅ Google OAuth: Configured
✅ Stripe: Configured
⚠️ SendGrid: Not configured (optional)
```

## Lưu ý bảo mật

- Không commit file `.env` vào git
- Luôn dùng strong secrets cho production
- Thay đổi tất cả keys khi chuyển từ test sang production
- Sử dụng test keys cho development