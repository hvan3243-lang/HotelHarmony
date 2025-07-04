-- HotelLux Database Export for PostgreSQL
-- Created: July 04, 2025
-- 
-- Instructions:
-- 1. Create database: CREATE DATABASE hotellux;
-- 2. Connect to database: \c hotellux;
-- 3. Run this file: \i database_export.sql

-- Create tables structure
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer',
    preferences TEXT[] DEFAULT '{}',
    is_vip BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    number VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    capacity INTEGER NOT NULL,
    amenities TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'available',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    check_in_time VARCHAR(10) DEFAULT '14:00',
    check_out_time VARCHAR(10) DEFAULT '12:00',
    total_price DECIMAL(10,2) NOT NULL,
    guests INTEGER DEFAULT 1,
    special_requests TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_intent_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_from_admin BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    target_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100),
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new',
    admin_response TEXT,
    admin_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loyalty_points (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    level VARCHAR(20) DEFAULT 'Bronze',
    total_spent DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS point_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotional_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percent INTEGER,
    discount_amount DECIMAL(10,2),
    min_amount DECIMAL(10,2),
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    user_level VARCHAR(20),
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (email, password, first_name, last_name, phone, role, preferences, is_vip) VALUES 
('admin@hotellux.com', '$2b$10$whMLMCGHZXgK5XjIe9i2me271ZANcIO1Uep4GnNDDM3dSVcR5h9Oy', 'Admin', 'User', '+1-555-0100', 'admin', '{"luxury", "spa"}', false),
('customer@hotellux.com', '$2b$10$kmpGPPPhxvVaVWTSR9eVLuqe5EOCfzM04MUJRFYbeIO7sboLQQlUO', 'John', 'Doe', '+1-555-0200', 'customer', '{"wifi", "ac"}', false);

INSERT INTO rooms (number, type, price, capacity, amenities, images, status, description) VALUES 
('101', 'suite', '200.00', 3, '{"wifi", "ac", "oceanView", "balcony"}', '{"https://images.unsplash.com/photo-1540518614846-7eded1dcaeb6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"}', 'available', 'Phòng suite sang trọng với view biển tuyệt đẹp'),
('102', 'deluxe', '150.00', 2, '{"wifi", "ac", "livingRoom"}', '{"https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"}', 'available', 'Phòng deluxe hiện đại với phòng khách riêng'),
('201', 'standard', '100.00', 2, '{"wifi", "ac"}', '{"https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"}', 'available', 'Phòng standard thoải mái với tiện nghi cơ bản'),
('301', 'presidential', '500.00', 4, '{"wifi", "ac", "oceanView", "livingRoom", "bedrooms", "fullKitchen", "balcony"}', '{"https://images.unsplash.com/photo-1578774296253-dc2178e4b0b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"}', 'available', 'Phòng tổng thống đẳng cấp với 2 phòng ngủ');

INSERT INTO services (name, description, price, category, is_active) VALUES 
('Spa & Massage', 'Dịch vụ massage thư giãn và chăm sóc spa cao cấp', '80.00', 'spa', true),
('Buffet Breakfast', 'Bữa sáng buffet đa dạng với món Á và Âu', '25.00', 'food', true),
('Airport Transfer', 'Dịch vụ đưa đón sân bay chuyên nghiệp', '30.00', 'transport', true),
('Laundry Service', 'Dịch vụ giặt ủi nhanh chóng trong ngày', '15.00', 'service', true),
('City Tour', 'Tour tham quan thành phố với hướng dẫn viên', '50.00', 'tour', true);

INSERT INTO blog_posts (title, slug, content, excerpt, author_id, category, is_published) VALUES 
('Chào mừng đến với HotelLux', 'chao-mung-den-voi-hotellux', 
'# Chào mừng đến với HotelLux

HotelLux tự hào là khách sạn 5 sao hàng đầu với dịch vụ đẳng cấp quốc tế. Chúng tôi cam kết mang đến cho quý khách những trải nghiệm nghỉ dưỡng tuyệt vời nhất.

## Tiện nghi cao cấp

- Phòng suite sang trọng với view biển
- Spa & massage thư giãn
- Nhà hàng 5 sao với ẩm thực đa dạng
- Dịch vụ 24/7 chuyên nghiệp

## Đặt phòng ngay hôm nay

Liên hệ với chúng tôi để được tư vấn và đặt phòng với giá ưu đãi nhất.',
'Khám phá khách sạn 5 sao HotelLux với dịch vụ đẳng cấp và tiện nghi cao cấp.', 1, 'welcome', true),

('Top 5 địa điểm du lịch gần khách sạn', 'top-5-dia-diem-du-lich-gan-khach-san',
'# Top 5 địa điểm du lịch gần khách sạn

Khám phá những địa điểm tuyệt vời xung quanh HotelLux:

## 1. Bãi biển Sunrise
Bãi biển với bình minh đẹp nhất thành phố, cách khách sạn chỉ 5 phút đi bộ.

## 2. Khu phố cổ
Trải nghiệm văn hóa truyền thống với các cửa hàng thủ công mỹ nghệ.

## 3. Chợ đêm
Thưởng thức ẩm thực đường phố đa dạng và mua sắm quà lưu niệm.

## 4. Công viên trung tâm
Không gian xanh lý tưởng cho việc thư giãn và tập thể dục.

## 5. Bảo tàng nghệ thuật
Khám phá nghệ thuật địa phương và triển lãm quốc tế.',
'Khám phá 5 địa điểm du lịch hấp dẫn gần khách sạn HotelLux.', 1, 'travel', true);

-- Initialize loyalty points for users
INSERT INTO loyalty_points (user_id, points, level, total_spent) VALUES 
(1, 0, 'Bronze', 0),
(2, 0, 'Bronze', 0);

-- Sample promotional codes
INSERT INTO promotional_codes (code, discount_percent, min_amount, max_uses, user_level, expires_at, is_active) VALUES 
('WELCOME10', 10, 100, 100, 'Bronze', '2025-12-31 23:59:59', true),
('VIP20', 20, 200, 50, 'Gold', '2025-12-31 23:59:59', true),
('SUMMER15', 15, 150, 200, 'Silver', '2025-08-31 23:59:59', true);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_rooms_number ON rooms(number);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_reviews_room_id ON reviews(room_id);
CREATE INDEX idx_loyalty_points_user_id ON loyalty_points(user_id);
CREATE INDEX idx_promotional_codes_code ON promotional_codes(code);

-- Create sequence for auto-increment (if needed)
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('rooms_id_seq', (SELECT MAX(id) FROM rooms));
SELECT setval('services_id_seq', (SELECT MAX(id) FROM services));
SELECT setval('blog_posts_id_seq', (SELECT MAX(id) FROM blog_posts));
SELECT setval('loyalty_points_id_seq', (SELECT MAX(id) FROM loyalty_points));
SELECT setval('promotional_codes_id_seq', (SELECT MAX(id) FROM promotional_codes));

-- Display setup completion
SELECT 'Database setup completed successfully!' as status;
SELECT 'Admin account: admin@hotellux.com / admin123' as admin_info;
SELECT 'Customer account: customer@hotellux.com / customer123' as customer_info;
SELECT COUNT(*) || ' users created' as users_count FROM users;
SELECT COUNT(*) || ' rooms created' as rooms_count FROM rooms;
SELECT COUNT(*) || ' services created' as services_count FROM services;
SELECT COUNT(*) || ' blog posts created' as blog_count FROM blog_posts;