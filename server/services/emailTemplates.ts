interface BookingData {
  id: number;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  room: {
    number: string;
    type: string;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: string;
  status: string;
  specialRequests?: string;
  loyaltyPoints?: number;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

export function createBookingConfirmationEmail(booking: BookingData, language: string = 'vi'): EmailTemplate {
  const isVietnamese = language === 'vi';
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isVietnamese 
      ? date.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatPrice = (price: string) => {
    return parseFloat(price).toLocaleString(isVietnamese ? 'vi-VN' : 'en-US') + (isVietnamese ? 'đ' : ' VND');
  };

  const content = isVietnamese ? {
    subject: `Xác nhận đặt phòng #${booking.id} - HotelLux`,
    greeting: `Kính chào ${booking.user.firstName},`,
    title: 'Xác nhận đặt phòng thành công!',
    thankYou: 'Cảm ơn bạn đã chọn HotelLux cho kỳ nghỉ của mình. Chúng tôi rất vui được phục vụ bạn.',
    bookingDetails: 'Chi tiết đặt phòng',
    bookingId: 'Mã đặt phòng',
    room: 'Phòng',
    checkIn: 'Nhận phòng',
    checkOut: 'Trả phòng',
    guests: 'Số khách',
    total: 'Tổng tiền',
    status: 'Trạng thái',
    specialRequests: 'Yêu cầu đặc biệt',
    loyaltyPoints: 'Điểm thưởng',
    loyaltyEarned: 'Bạn đã tích được',
    nextSteps: 'Bước tiếp theo',
    checkInTime: 'Thời gian nhận phòng: 14:00',
    checkOutTime: 'Thời gian trả phòng: 12:00',
    bringId: 'Vui lòng mang theo CMND/CCCD khi check-in',
    contact: 'Liên hệ với chúng tôi',
    phone: 'Điện thoại',
    email: 'Email',
    address: 'Địa chỉ',
    footer: 'Trân trọng,<br>Đội ngũ HotelLux',
    unsubscribe: 'Nếu bạn không muốn nhận email này, vui lòng liên hệ với chúng tôi.',
  } : {
    subject: `Booking Confirmation #${booking.id} - HotelLux`,
    greeting: `Dear ${booking.user.firstName},`,
    title: 'Booking Confirmation Successful!',
    thankYou: 'Thank you for choosing HotelLux for your stay. We are delighted to serve you.',
    bookingDetails: 'Booking Details',
    bookingId: 'Booking ID',
    room: 'Room',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    guests: 'Guests',
    total: 'Total Amount',
    status: 'Status',
    specialRequests: 'Special Requests',
    loyaltyPoints: 'Loyalty Points',
    loyaltyEarned: 'You earned',
    nextSteps: 'Next Steps',
    checkInTime: 'Check-in time: 2:00 PM',
    checkOutTime: 'Check-out time: 12:00 PM',
    bringId: 'Please bring your ID when checking in',
    contact: 'Contact Us',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    footer: 'Best regards,<br>HotelLux Team',
    unsubscribe: 'If you no longer wish to receive these emails, please contact us.',
  };

  const statusColor = booking.status === 'confirmed' ? '#10b981' : 
                     booking.status === 'pending' ? '#f59e0b' : '#6b7280';

  const statusText = isVietnamese ? {
    confirmed: 'Đã xác nhận',
    pending: 'Chờ xác nhận',
    deposit_paid: 'Đã đặt cọc'
  } : {
    confirmed: 'Confirmed',
    pending: 'Pending',
    deposit_paid: 'Deposit Paid'
  };

  const html = `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${content.subject}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background-color: #f8f9fa;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%); 
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
        }
        .header h1 { 
          font-size: 28px; 
          margin-bottom: 8px; 
          font-weight: 700; 
        }
        .header p { 
          font-size: 16px; 
          opacity: 0.9; 
        }
        .content { 
          padding: 40px 30px; 
        }
        .greeting { 
          font-size: 18px; 
          margin-bottom: 20px; 
          color: #1f2937; 
        }
        .message { 
          font-size: 16px; 
          margin-bottom: 30px; 
          color: #6b7280; 
          line-height: 1.7; 
        }
        .booking-card { 
          background: #f8fafc; 
          border: 1px solid #e2e8f0; 
          border-radius: 12px; 
          padding: 25px; 
          margin: 25px 0; 
        }
        .booking-card h3 { 
          color: #0d9488; 
          font-size: 20px; 
          margin-bottom: 20px; 
          font-weight: 600; 
        }
        .detail-row { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          padding: 12px 0; 
          border-bottom: 1px solid #e2e8f0; 
        }
        .detail-row:last-child { 
          border-bottom: none; 
        }
        .detail-label { 
          font-weight: 600; 
          color: #374151; 
        }
        .detail-value { 
          color: #6b7280; 
          text-align: right; 
        }
        .total-row { 
          background: #ecfdf5; 
          margin: 15px -25px -25px -25px; 
          padding: 20px 25px; 
          border-radius: 0 0 12px 12px; 
        }
        .total-row .detail-label, 
        .total-row .detail-value { 
          color: #065f46; 
          font-size: 18px; 
          font-weight: 700; 
        }
        .status-badge { 
          display: inline-block; 
          padding: 6px 12px; 
          border-radius: 20px; 
          color: white; 
          font-size: 12px; 
          font-weight: 600; 
          text-transform: uppercase; 
          letter-spacing: 0.5px; 
        }
        .next-steps { 
          background: #fef3c7; 
          border-left: 4px solid #f59e0b; 
          padding: 20px; 
          margin: 25px 0; 
          border-radius: 0 8px 8px 0; 
        }
        .next-steps h4 { 
          color: #92400e; 
          margin-bottom: 12px; 
          font-size: 16px; 
        }
        .next-steps ul { 
          list-style: none; 
          color: #b45309; 
        }
        .next-steps li { 
          margin: 8px 0; 
          padding-left: 20px; 
          position: relative; 
        }
        .next-steps li:before { 
          content: "✓"; 
          position: absolute; 
          left: 0; 
          color: #f59e0b; 
          font-weight: bold; 
        }
        .contact-section { 
          background: #f1f5f9; 
          padding: 25px; 
          margin: 25px -30px -40px -30px; 
          border-radius: 0 0 12px 12px; 
        }
        .contact-section h4 { 
          color: #0f172a; 
          margin-bottom: 15px; 
          font-size: 18px; 
        }
        .contact-info { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
          gap: 15px; 
        }
        .contact-item { 
          color: #475569; 
          font-size: 14px; 
        }
        .contact-item strong { 
          color: #0f172a; 
          display: block; 
          margin-bottom: 4px; 
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          color: #9ca3af; 
          font-size: 12px; 
          background: #f9fafb; 
        }
        .loyalty-highlight { 
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); 
          color: white; 
          padding: 15px; 
          border-radius: 8px; 
          margin: 20px 0; 
          text-align: center; 
        }
        .loyalty-highlight strong { 
          font-size: 20px; 
        }
        @media (max-width: 600px) {
          .container { margin: 10px; border-radius: 8px; }
          .header, .content { padding: 20px; }
          .booking-card { padding: 20px; }
          .detail-row { flex-direction: column; align-items: flex-start; gap: 5px; }
          .detail-value { text-align: left; }
          .contact-info { grid-template-columns: 1fr; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>HotelLux</h1>
          <p>${content.title}</p>
        </div>
        
        <div class="content">
          <p class="greeting">${content.greeting}</p>
          <p class="message">${content.thankYou}</p>
          
          <div class="booking-card">
            <h3>${content.bookingDetails}</h3>
            <div class="detail-row">
              <span class="detail-label">${content.bookingId}:</span>
              <span class="detail-value">#HLX${booking.id}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">${content.room}:</span>
              <span class="detail-value">${booking.room.type.charAt(0).toUpperCase() + booking.room.type.slice(1)} - ${isVietnamese ? 'Số' : 'Room'} ${booking.room.number}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">${content.checkIn}:</span>
              <span class="detail-value">${formatDate(booking.checkIn)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">${content.checkOut}:</span>
              <span class="detail-value">${formatDate(booking.checkOut)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">${content.guests}:</span>
              <span class="detail-value">${booking.guests} ${isVietnamese ? 'người' : 'guest(s)'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">${content.status}:</span>
              <span class="detail-value">
                <span class="status-badge" style="background-color: ${statusColor};">
                  ${statusText[booking.status as keyof typeof statusText] || booking.status}
                </span>
              </span>
            </div>
            ${booking.specialRequests ? `
            <div class="detail-row">
              <span class="detail-label">${content.specialRequests}:</span>
              <span class="detail-value">${booking.specialRequests}</span>
            </div>` : ''}
            <div class="total-row">
              <div class="detail-row">
                <span class="detail-label">${content.total}:</span>
                <span class="detail-value">${formatPrice(booking.totalPrice)}</span>
              </div>
            </div>
          </div>
          
          ${booking.loyaltyPoints ? `
          <div class="loyalty-highlight">
            <p>${content.loyaltyEarned} <strong>${booking.loyaltyPoints}</strong> ${content.loyaltyPoints.toLowerCase()}!</p>
          </div>` : ''}
          
          <div class="next-steps">
            <h4>${content.nextSteps}</h4>
            <ul>
              <li>${content.checkInTime}</li>
              <li>${content.checkOutTime}</li>
              <li>${content.bringId}</li>
            </ul>
          </div>
        </div>
        
        <div class="contact-section">
          <h4>${content.contact}</h4>
          <div class="contact-info">
            <div class="contact-item">
              <strong>${content.phone}:</strong>
              +84 123 456 789
            </div>
            <div class="contact-item">
              <strong>${content.email}:</strong>
              info@hotellux.com
            </div>
            <div class="contact-item">
              <strong>${content.address}:</strong>
              123 ${isVietnamese ? 'Đường ABC, Quận 1, TP.HCM' : 'ABC Street, District 1, Ho Chi Minh City'}
            </div>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p>${content.footer}</p>
        <p style="margin-top: 10px; font-size: 11px;">${content.unsubscribe}</p>
      </div>
    </body>
    </html>
  `;

  return {
    subject: content.subject,
    html
  };
}

export function createPaymentReminderEmail(booking: BookingData, language: string = 'vi'): EmailTemplate {
  const isVietnamese = language === 'vi';
  
  const content = isVietnamese ? {
    subject: `Nhắc nhở thanh toán - Đặt phòng #${booking.id}`,
    title: 'Nhắc nhở thanh toán',
    message: 'Bạn còn số tiền chưa thanh toán cho đặt phòng của mình.',
    action: 'Vui lòng hoàn tất thanh toán để đảm bảo đặt phòng của bạn.',
  } : {
    subject: `Payment Reminder - Booking #${booking.id}`,
    title: 'Payment Reminder',
    message: 'You have an outstanding payment for your booking.',
    action: 'Please complete payment to secure your reservation.',
  };

  const html = `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${content.subject}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
        .header { background: #ef4444; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .booking-summary { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .cta-button { 
          display: inline-block; 
          background: #ef4444; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 20px 0; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${content.title}</h1>
        </div>
        <div class="content">
          <p>Kính chào ${booking.user.firstName},</p>
          <p>${content.message}</p>
          <div class="booking-summary">
            <h3>Chi tiết đặt phòng #HLX${booking.id}</h3>
            <p><strong>Phòng:</strong> ${booking.room.number} - ${booking.room.type}</p>
            <p><strong>Tổng tiền:</strong> ${parseFloat(booking.totalPrice).toLocaleString('vi-VN')}đ</p>
          </div>
          <p>${content.action}</p>
          <a href="#" class="cta-button">Thanh toán ngay</a>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject: content.subject, html };
}

export function createWelcomeEmail(user: { firstName: string; lastName: string; email: string }, language: string = 'vi'): EmailTemplate {
  const isVietnamese = language === 'vi';
  
  const content = isVietnamese ? {
    subject: 'Chào mừng đến với HotelLux!',
    title: 'Chào mừng đến với HotelLux',
    message: 'Cảm ơn bạn đã đăng ký tài khoản. Chúng tôi rất vui được phục vụ bạn.',
    benefits: 'Quyền lợi thành viên',
    benefit1: 'Đặt phòng nhanh chóng và tiện lợi',
    benefit2: 'Tích điểm thưởng với mỗi lần đặt phòng',
    benefit3: 'Ưu đãi và khuyến mãi độc quyền',
    benefit4: 'Hỗ trợ khách hàng 24/7',
  } : {
    subject: 'Welcome to HotelLux!',
    title: 'Welcome to HotelLux',
    message: 'Thank you for registering an account. We are delighted to serve you.',
    benefits: 'Member Benefits',
    benefit1: 'Quick and convenient room booking',
    benefit2: 'Earn loyalty points with every booking',
    benefit3: 'Exclusive offers and promotions',
    benefit4: '24/7 customer support',
  };

  const html = `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${content.subject}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f0f9ff; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .benefits { background: #f0f9ff; border-radius: 8px; padding: 25px; margin: 25px 0; }
        .benefit-item { margin: 12px 0; padding-left: 25px; position: relative; }
        .benefit-item:before { content: "✓"; position: absolute; left: 0; color: #0d9488; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>HotelLux</h1>
          <p>${content.title}</p>
        </div>
        <div class="content">
          <p>Xin chào ${user.firstName},</p>
          <p>${content.message}</p>
          <div class="benefits">
            <h3>${content.benefits}:</h3>
            <div class="benefit-item">${content.benefit1}</div>
            <div class="benefit-item">${content.benefit2}</div>
            <div class="benefit-item">${content.benefit3}</div>
            <div class="benefit-item">${content.benefit4}</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject: content.subject, html };
}