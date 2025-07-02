import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.log("⚠ Email service: SENDGRID_API_KEY not configured - email notifications will be simulated");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('Email would be sent:', params);
    return true; // Return true in development without API key
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export async function sendBookingConfirmation(
  email: string, 
  booking: any, 
  room: any, 
  user: any
): Promise<boolean> {
  const subject = `Xác nhận đặt phòng #${booking.id} - HotelLux`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #0d9488;">HotelLux - Xác nhận đặt phòng</h1>
      
      <p>Kính chào ${user.firstName} ${user.lastName},</p>
      
      <p>Cảm ơn bạn đã đặt phòng tại HotelLux. Dưới đây là thông tin chi tiết:</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Thông tin đặt phòng</h3>
        <p><strong>Mã đặt phòng:</strong> #HLX${booking.id}</p>
        <p><strong>Phòng:</strong> ${room.type} - Số ${room.number}</p>
        <p><strong>Check-in:</strong> ${new Date(booking.checkIn).toLocaleDateString('vi-VN')}</p>
        <p><strong>Check-out:</strong> ${new Date(booking.checkOut).toLocaleDateString('vi-VN')}</p>
        <p><strong>Số khách:</strong> ${booking.guests}</p>
        <p><strong>Tổng tiền:</strong> ${Number(booking.totalPrice).toLocaleString('vi-VN')}đ</p>
      </div>
      
      <p>Chúng tôi rất mong được phục vụ bạn. Nếu có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
      
      <p>Trân trọng,<br>Đội ngũ HotelLux</p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@hotellux.com',
    subject,
    html,
  });
}
