# Google OAuth Setup Guide

## 1. Tạo Google Cloud Project

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Bật APIs & Services > Library > Google+ API

## 2. Tạo OAuth 2.0 Credentials

1. Vào **APIs & Services** > **Credentials**
2. Nhấn **+ CREATE CREDENTIALS** > **OAuth 2.0 Client ID**
3. Chọn **Web application**
4. Điền thông tin:
   - **Name**: HotelLux OAuth Client
   - **Authorized JavaScript origins**: 
     - `https://15bbd97e-5fe7-46f4-af19-2831f63b4964-00-2mdengl1ik20m.spock.replit.dev`
     - `http://localhost:5000`
   - **Authorized redirect URIs**:
     - `https://15bbd97e-5fe7-46f4-af19-2831f63b4964-00-2mdengl1ik20m.spock.replit.dev/api/auth/google/callback`
     - `http://localhost:5000/api/auth/google/callback`

## 3. Lấy Client ID và Client Secret

Sau khi tạo xong, copy các thông tin sau:
- **Client ID**: `your-client-id.apps.googleusercontent.com`
- **Client Secret**: `your-client-secret`

## 4. Cấu hình trong Replit

1. Vào **Secrets** tab trong Replit
2. Thêm các environment variables:
   - `GOOGLE_CLIENT_ID`: paste client ID
   - `GOOGLE_CLIENT_SECRET`: paste client secret

## 5. Cấu hình cho Local Development

Tạo file `.env` trong thư mục gốc:

```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/hotellux

# Authentication
JWT_SECRET=your-jwt-secret-key
SESSION_SECRET=your-session-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Payment
STRIPE_SECRET_KEY=sk_test_your-stripe-key
VITE_STRIPE_PUBLIC_KEY=pk_test_your-stripe-public-key

# Email
SENDGRID_API_KEY=SG.your-sendgrid-key

# Development
NODE_ENV=development
PORT=5000
```

## 6. Test OAuth Flow

1. Khởi động server: `npm run dev`
2. Vào trang đăng nhập
3. Nhấn "Đăng nhập với Google"
4. Chọn tài khoản Google để đăng nhập
5. Sau khi đăng nhập thành công, sẽ được chuyển về trang chủ

## Lưu ý quan trọng

- URL Replit có thể thay đổi khi restart workspace
- Cần cập nhật authorized redirect URIs trong Google Console khi URL thay đổi
- Cho production, nên sử dụng domain cố định