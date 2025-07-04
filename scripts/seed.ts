import { db } from '../server/db.js';
import { users, rooms, services, blogPosts } from '../shared/schema.js';
import bcrypt from 'bcrypt';

async function seed() {
  console.log('🌱 Bắt đầu seed data...');

  try {
    // Tạo admin user
    console.log('👤 Tạo admin user...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    
    await db.insert(users).values({
      email: 'admin@hotellux.com',
      password: hashedAdminPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1-555-0100',
      role: 'admin',
      preferences: ['luxury', 'spa'],
      isVip: false
    });

    // Tạo customer user
    console.log('👤 Tạo customer user...');
    const hashedCustomerPassword = await bcrypt.hash('customer123', 10);
    
    await db.insert(users).values({
      email: 'customer@hotellux.com',
      password: hashedCustomerPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1-555-0200',
      role: 'customer',
      preferences: ['wifi', 'ac'],
      isVip: false
    });

    // Tạo sample rooms
    console.log('🏨 Tạo phòng mẫu...');
    await db.insert(rooms).values([
      {
        number: '101',
        type: 'suite',
        price: '200.00',
        capacity: 3,
        amenities: ['wifi', 'ac', 'oceanView', 'balcony'],
        images: [
          'https://images.unsplash.com/photo-1540518614846-7eded1dcaeb6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
          'https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
        ],
        status: 'available',
        description: 'Phòng suite sang trọng với view biển tuyệt đẹp, ban công riêng và đầy đủ tiện nghi cao cấp.'
      },
      {
        number: '102',
        type: 'deluxe',
        price: '150.00',
        capacity: 2,
        amenities: ['wifi', 'ac', 'livingRoom'],
        images: [
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
          'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
        ],
        status: 'available',
        description: 'Phòng deluxe hiện đại với phòng khách riêng biệt và view thành phố.'
      },
      {
        number: '201',
        type: 'standard',
        price: '100.00',
        capacity: 2,
        amenities: ['wifi', 'ac'],
        images: [
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
        ],
        status: 'available',
        description: 'Phòng standard thoải mái với đầy đủ tiện nghi cơ bản.'
      },
      {
        number: '301',
        type: 'presidential',
        price: '500.00',
        capacity: 4,
        amenities: ['wifi', 'ac', 'oceanView', 'livingRoom', 'bedrooms', 'fullKitchen', 'balcony'],
        images: [
          'https://images.unsplash.com/photo-1578774296253-dc2178e4b0b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
          'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
        ],
        status: 'available',
        description: 'Phòng tổng thống đẳng cấp với 2 phòng ngủ, bếp đầy đủ và view biển panorama.'
      }
    ]);

    // Tạo services
    console.log('🛎️ Tạo dịch vụ...');
    await db.insert(services).values([
      {
        name: 'Spa & Massage',
        description: 'Dịch vụ massage thư giãn và chăm sóc spa cao cấp',
        price: '80.00',
        category: 'spa',
        isActive: true
      },
      {
        name: 'Buffet Breakfast',
        description: 'Bữa sáng buffet đa dạng với món Á và Âu',
        price: '25.00',
        category: 'food',
        isActive: true
      },
      {
        name: 'Airport Transfer',
        description: 'Dịch vụ đưa đón sân bay chuyên nghiệp',
        price: '30.00',
        category: 'transport',
        isActive: true
      },
      {
        name: 'Laundry Service',
        description: 'Dịch vụ giặt ủi nhanh chóng trong ngày',
        price: '15.00',
        category: 'service',
        isActive: true
      },
      {
        name: 'City Tour',
        description: 'Tour tham quan thành phố với hướng dẫn viên',
        price: '50.00',
        category: 'tour',
        isActive: true
      }
    ]);

    // Tạo blog posts
    console.log('📝 Tạo blog posts...');
    const adminUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.role, 'admin')
    });

    if (adminUser) {
      await db.insert(blogPosts).values([
        {
          title: 'Chào mừng đến với HotelLux',
          slug: 'chao-mung-den-voi-hotellux',
          content: `
# Chào mừng đến với HotelLux

HotelLux tự hào là khách sạn 5 sao hàng đầu với dịch vụ đẳng cấp quốc tế. Chúng tôi cam kết mang đến cho quý khách những trải nghiệm nghỉ dưỡng tuyệt vời nhất.

## Tiện nghi cao cấp

- Phòng suite sang trọng với view biển
- Spa & massage thư giãn
- Nhà hàng 5 sao với ẩm thực đa dạng
- Dịch vụ 24/7 chuyên nghiệp

## Đặt phòng ngay hôm nay

Liên hệ với chúng tôi để được tư vấn và đặt phòng với giá ưu đãi nhất.
          `,
          excerpt: 'Khám phá khách sạn 5 sao HotelLux với dịch vụ đẳng cấp và tiện nghi cao cấp.',
          authorId: adminUser.id,
          isPublished: true
        },
        {
          title: 'Top 5 địa điểm du lịch gần khách sạn',
          slug: 'top-5-dia-diem-du-lich-gan-khach-san',
          content: `
# Top 5 địa điểm du lịch gần khách sạn

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
Khám phá nghệ thuật địa phương và triển lãm quốc tế.
          `,
          excerpt: 'Khám phá 5 địa điểm du lịch hấp dẫn gần khách sạn HotelLux.',
          authorId: adminUser.id,
          isPublished: true
        }
      ]);
    }

    console.log('✅ Seed data hoàn tất!');
    console.log('');
    console.log('🔑 Tài khoản đã tạo:');
    console.log('- Admin: admin@hotellux.com / admin123');
    console.log('- Customer: customer@hotellux.com / customer123');
    console.log('');
    console.log('🏨 Đã tạo 4 phòng mẫu');
    console.log('🛎️ Đã tạo 5 dịch vụ');
    console.log('📝 Đã tạo 2 blog posts');

  } catch (error) {
    console.error('❌ Lỗi seed data:', error);
  } finally {
    process.exit(0);
  }
}

seed();