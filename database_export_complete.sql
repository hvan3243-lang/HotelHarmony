-- HotelLux Database Export for PostgreSQL
-- Created: July 04, 2025
-- Complete export of all 16 tables with structure and data
-- 
-- Instructions:
-- 1. Create database: CREATE DATABASE hotellux;
-- 2. Connect to database: \c hotellux;
-- 3. Run this file: \i database_export_complete.sql

-- Drop tables if they exist (for clean import)
DROP TABLE IF EXISTS promotional_code_usage CASCADE;
DROP TABLE IF EXISTS booking_services CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS point_transactions CASCADE;
DROP TABLE IF EXISTS promotional_codes CASCADE;
DROP TABLE IF EXISTS loyalty_points CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create all 16 tables structure
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    preferences JSONB DEFAULT '[]',
    is_vip BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    number TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    price NUMERIC NOT NULL,
    capacity INTEGER NOT NULL,
    amenities JSONB DEFAULT '[]',
    images JSONB DEFAULT '[]',
    status TEXT DEFAULT 'available',
    description TEXT,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    category TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    check_in TIMESTAMP NOT NULL,
    check_out TIMESTAMP NOT NULL,
    guests INTEGER NOT NULL,
    total_price NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    special_requests TEXT,
    payment_intent_id TEXT,
    payment_method TEXT,
    check_in_time TEXT DEFAULT '14:00',
    check_out_time TEXT DEFAULT '12:00',
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_from_admin BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE blog_posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[],
    image TEXT,
    published BOOLEAN DEFAULT false,
    read_time INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    category VARCHAR(100) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    preferred_contact VARCHAR(20) DEFAULT 'email',
    status VARCHAR(20) DEFAULT 'pending',
    admin_response TEXT,
    responded_by INTEGER REFERENCES users(id),
    responded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    cleanliness INTEGER DEFAULT 5,
    service INTEGER DEFAULT 5,
    amenities INTEGER DEFAULT 5,
    value_for_money INTEGER DEFAULT 5,
    location INTEGER DEFAULT 5,
    would_recommend BOOLEAN DEFAULT true,
    guest_type VARCHAR(50) DEFAULT 'Individual',
    stay_purpose VARCHAR(50) DEFAULT 'Leisure',
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE loyalty_points (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    level VARCHAR(20) DEFAULT 'Bronze',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE point_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES bookings(id),
    type VARCHAR(20) NOT NULL,
    points INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE promotional_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL,
    discount_value NUMERIC NOT NULL,
    min_amount NUMERIC DEFAULT 0,
    max_discount NUMERIC,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE promotional_code_usage (
    id SERIAL PRIMARY KEY,
    code_id INTEGER REFERENCES promotional_codes(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    discount_amount NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE booking_services (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    total_price NUMERIC NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    id_number TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    date_of_birth TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    employee_code TEXT UNIQUE NOT NULL,
    department TEXT,
    position TEXT NOT NULL,
    salary NUMERIC,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    invoice_number TEXT UNIQUE NOT NULL,
    room_total NUMERIC NOT NULL,
    services_total NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'unpaid',
    paid_amount NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Insert sample data into users table
INSERT INTO users (id, email, password, first_name, last_name, phone, role, preferences, is_vip, created_at) VALUES
(1, 'admin@hotellux.com', '$2b$10$whMLMCGHZXgK5XjIe9i2me271ZANcIO1Uep4GnNDDM3dSVcR5h9Oy', 'Admin', 'User', '+1-555-0100', 'admin', '["luxury", "spa"]', false, '2025-07-02 03:49:25.087507'),
(2, 'customer@hotellux.com', '$2b$10$kmpGPPPhxvVaVWTSR9eVLuqe5EOCfzM04MUJRFYbeIO7sboLQQlUO', 'John', 'Doe', '+1-555-0200', 'customer', '["wifi", "ac"]', false, '2025-07-02 09:33:51.816511');

-- Insert sample data into rooms table
INSERT INTO rooms (id, number, type, price, capacity, amenities, images, status, description, created_at) VALUES
(1, '101', 'suite', 200.00, 3, '["wifi", "ac", "oceanView", "balcony"]', '["https://images.unsplash.com/photo-1540518614846-7eded1dcaeb6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", "https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"]', 'available', 'Phòng suite sang trọng với view biển tuyệt đẹp, ban công riêng và đầy đủ tiện nghi cao cấp.', now()),
(2, '102', 'deluxe', 150.00, 2, '["wifi", "ac", "livingRoom"]', '["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"]', 'available', 'Phòng deluxe hiện đại với phòng khách riêng biệt và view thành phố.', now()),
(3, '201', 'standard', 100.00, 2, '["wifi", "ac"]', '["https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"]', 'available', 'Phòng standard thoải mái với đầy đủ tiện nghi cơ bản.', now()),
(4, '301', 'presidential', 500.00, 4, '["wifi", "ac", "oceanView", "livingRoom", "bedrooms", "fullKitchen", "balcony"]', '["https://images.unsplash.com/photo-1578774296253-dc2178e4b0b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80", "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"]', 'available', 'Phòng tổng thống đẳng cấp với 2 phòng ngủ, bếp đầy đủ và view biển panorama.', now());

-- Insert sample data into services table
INSERT INTO services (id, name, description, price, category, is_active, created_at) VALUES
(1, 'Spa & Massage', 'Dịch vụ massage thư giãn và chăm sóc spa cao cấp', 80.00, 'spa', true, now()),
(2, 'Buffet Breakfast', 'Bữa sáng buffet đa dạng với món Á và Âu', 25.00, 'food', true, now()),
(3, 'Airport Transfer', 'Dịch vụ đưa đón sân bay chuyên nghiệp', 30.00, 'transport', true, now()),
(4, 'Laundry Service', 'Dịch vụ giặt ủi nhanh chóng trong ngày', 15.00, 'service', true, now()),
(5, 'City Tour', 'Tour tham quan thành phố với hướng dẫn viên', 50.00, 'tour', true, now());

-- Insert sample data into blog_posts table
INSERT INTO blog_posts (id, title, slug, excerpt, content, author, category, tags, image, published, read_time, created_at, updated_at) VALUES
(1, 'Chào mừng đến với HotelLux', 'chao-mung-den-voi-hotellux', 'Khám phá khách sạn 5 sao HotelLux với dịch vụ đẳng cấp và tiện nghi cao cấp.', 
'# Chào mừng đến với HotelLux

HotelLux tự hào là khách sạn 5 sao hàng đầu với dịch vụ đẳng cấp quốc tế. Chúng tôi cam kết mang đến cho quý khách những trải nghiệm nghỉ dưỡng tuyệt vời nhất.

## Tiện nghi cao cấp

- Phòng suite sang trọng với view biển
- Spa & massage thư giãn
- Nhà hàng 5 sao với ẩm thực đa dạng
- Dịch vụ 24/7 chuyên nghiệp

## Đặt phòng ngay hôm nay

Liên hệ với chúng tôi để được tư vấn và đặt phòng với giá ưu đãi nhất.', 
'Admin User', 'welcome', '{"khách sạn", "5 sao", "luxury"}', null, true, 5, now(), now()),

(2, 'Top 5 địa điểm du lịch gần khách sạn', 'top-5-dia-diem-du-lich-gan-khach-san', 'Khám phá 5 địa điểm du lịch hấp dẫn gần khách sạn HotelLux.',
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
'Admin User', 'travel', '{"du lịch", "địa điểm", "khám phá"}', null, true, 7, now(), now());

-- Initialize loyalty points for users
INSERT INTO loyalty_points (user_id, points, total_earned, level, created_at, updated_at) VALUES
(1, 0, 0, 'Bronze', now(), now()),
(2, 0, 0, 'Bronze', now(), now());

-- Sample promotional codes
INSERT INTO promotional_codes (code, name, description, discount_type, discount_value, min_amount, max_discount, usage_limit, used_count, valid_from, valid_to, is_active, created_at) VALUES
('WELCOME10', 'Chào mừng khách hàng mới', 'Giảm 10% cho đơn đặt phòng đầu tiên', 'percentage', 10, 100, 50, 100, 0, '2025-01-01', '2025-12-31', true, now()),
('VIP20', 'Khuyến mãi VIP', 'Giảm 20% cho khách VIP', 'percentage', 20, 200, 100, 50, 0, '2025-01-01', '2025-12-31', true, now()),
('SUMMER15', 'Khuyến mãi hè', 'Giảm 15% cho mùa hè', 'percentage', 15, 150, 75, 200, 0, '2025-06-01', '2025-08-31', true, now());

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_rooms_number ON rooms(number);
CREATE INDEX idx_rooms_type ON rooms(type);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON blog_posts(published);
CREATE INDEX idx_contact_messages_status ON contact_messages(status);
CREATE INDEX idx_reviews_room_id ON reviews(room_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_loyalty_points_user_id ON loyalty_points(user_id);
CREATE INDEX idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX idx_promotional_codes_code ON promotional_codes(code);
CREATE INDEX idx_promotional_codes_active ON promotional_codes(is_active);
CREATE INDEX idx_customers_id_number ON customers(id_number);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_code ON employees(employee_code);
CREATE INDEX idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- Reset sequences to match inserted data
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('rooms_id_seq', (SELECT COALESCE(MAX(id), 1) FROM rooms));
SELECT setval('services_id_seq', (SELECT COALESCE(MAX(id), 1) FROM services));
SELECT setval('blog_posts_id_seq', (SELECT COALESCE(MAX(id), 1) FROM blog_posts));
SELECT setval('loyalty_points_id_seq', (SELECT COALESCE(MAX(id), 1) FROM loyalty_points));
SELECT setval('promotional_codes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM promotional_codes));

-- Display completion message
SELECT 'HotelLux Database setup completed successfully!' as status;
SELECT 'Tables created: 16' as table_count;
SELECT 'Admin account: admin@hotellux.com / admin123' as admin_info;
SELECT 'Customer account: customer@hotellux.com / customer123' as customer_info;
SELECT COUNT(*) || ' users imported' as users_count FROM users;
SELECT COUNT(*) || ' rooms imported' as rooms_count FROM rooms;
SELECT COUNT(*) || ' services imported' as services_count FROM services;
SELECT COUNT(*) || ' blog posts imported' as blog_count FROM blog_posts;
SELECT 'Database ready for HotelLux application!' as final_status;