import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Language = 'vi' | 'en';

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'vi' as Language,
      setLanguage: (lang: Language) => set({ language: lang }),
    }),
    {
      name: 'hotel-language',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const translations = {
  vi: {
    // Navigation
    home: "Trang chủ",
    booking: "Đặt phòng",
    customer: "Khách hàng",
    admin: "Quản trị",
    contact: "Liên hệ",
    blog: "Blog",
    login: "Đăng nhập",
    logout: "Đăng xuất",
    register: "Đăng ký",

    // Common
    loading: "Đang tải...",
    error: "Lỗi",
    success: "Thành công",
    cancel: "Hủy",
    confirm: "Xác nhận",
    save: "Lưu",
    edit: "Chỉnh sửa",
    delete: "Xóa",
    add: "Thêm",
    search: "Tìm kiếm",
    filter: "Bộ lọc",
    sort: "Sắp xếp",
    back: "Quay lại",
    next: "Tiếp theo",
    previous: "Trước",
    submit: "Gửi",
    apply: "Áp dụng",
    clear: "Xóa",
    reset: "Đặt lại",

    // Booking
    checkIn: "Nhận phòng",
    checkOut: "Trả phòng",
    guests: "Số khách",
    rooms: "Phòng",
    room: "Phòng",
    roomType: "Loại phòng",
    roomNumber: "Số phòng",
    price: "Giá",
    total: "Tổng cộng",
    deposit: "Đặt cọc",
    remaining: "Còn lại",
    paymentMethod: "Phương thức thanh toán",
    paymentStatus: "Trạng thái thanh toán",
    bookingId: "Mã đặt phòng",
    bookingStatus: "Trạng thái đặt phòng",
    specialRequests: "Yêu cầu đặc biệt",

    // Status
    available: "Có sẵn",
    unavailable: "Không có sẵn",
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    cancelled: "Đã hủy",
    completed: "Hoàn thành",
    depositPaid: "Đã đặt cọc",

    // Payment
    creditCard: "Thẻ tín dụng",
    cashOnArrival: "Thanh toán khi nhận phòng",
    eWallet: "Ví điện tử",
    bankTransfer: "Chuyển khoản ngân hàng",
    
    // User
    profile: "Hồ sơ",
    firstName: "Tên",
    lastName: "Họ",
    email: "Email",
    phone: "Số điện thoại",
    address: "Địa chỉ",
    password: "Mật khẩu",
    confirmPassword: "Xác nhận mật khẩu",

    // Reviews
    reviews: "Đánh giá",
    rating: "Xếp hạng",
    writeReview: "Viết đánh giá",
    noReviews: "Chưa có đánh giá",
    reviewTitle: "Tiêu đề đánh giá",
    reviewComment: "Bình luận",

    // Loyalty
    loyaltyPoints: "Điểm thưởng",
    loyaltyLevel: "Hạng thành viên",
    bronze: "Đồng",
    silver: "Bạc",
    gold: "Vàng",
    platinum: "Bạch kim",
    earnedPoints: "Điểm tích được",
    redeemPoints: "Đổi điểm",

    // Promo codes
    promoCode: "Mã giảm giá",
    discount: "Giảm giá",
    validFrom: "Có hiệu lực từ",
    validTo: "Hết hạn",
    usageLimit: "Giới hạn sử dụng",
    minAmount: "Đơn tối thiểu",

    // Messages
    bookingSuccess: "Đặt phòng thành công!",
    bookingError: "Lỗi đặt phòng",
    paymentSuccess: "Thanh toán thành công!",
    paymentError: "Lỗi thanh toán",
    loginSuccess: "Đăng nhập thành công!",
    loginError: "Lỗi đăng nhập",
    registrationSuccess: "Đăng ký thành công!",
    registrationError: "Lỗi đăng ký",
  },
  en: {
    // Navigation
    home: "Home",
    booking: "Booking",
    customer: "Customer",
    admin: "Admin",
    contact: "Contact",
    blog: "Blog",
    login: "Login",
    logout: "Logout",
    register: "Register",

    // Common
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    add: "Add",
    search: "Search",
    filter: "Filter",
    sort: "Sort",
    back: "Back",
    next: "Next",
    previous: "Previous",
    submit: "Submit",
    apply: "Apply",
    clear: "Clear",
    reset: "Reset",

    // Booking
    checkIn: "Check-in",
    checkOut: "Check-out",
    guests: "Guests",
    rooms: "Rooms",
    room: "Room",
    roomType: "Room Type",
    roomNumber: "Room Number",
    price: "Price",
    total: "Total",
    deposit: "Deposit",
    remaining: "Remaining",
    paymentMethod: "Payment Method",
    paymentStatus: "Payment Status",
    bookingId: "Booking ID",
    bookingStatus: "Booking Status",
    specialRequests: "Special Requests",

    // Status
    available: "Available",
    unavailable: "Unavailable",
    pending: "Pending",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    completed: "Completed",
    depositPaid: "Deposit Paid",

    // Payment
    creditCard: "Credit Card",
    cashOnArrival: "Cash on Arrival",
    eWallet: "E-Wallet",
    bankTransfer: "Bank Transfer",
    
    // User
    profile: "Profile",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    phone: "Phone",
    address: "Address",
    password: "Password",
    confirmPassword: "Confirm Password",

    // Reviews
    reviews: "Reviews",
    rating: "Rating",
    writeReview: "Write Review",
    noReviews: "No reviews yet",
    reviewTitle: "Review Title",
    reviewComment: "Comment",

    // Loyalty
    loyaltyPoints: "Loyalty Points",
    loyaltyLevel: "Membership Level",
    bronze: "Bronze",
    silver: "Silver",
    gold: "Gold",
    platinum: "Platinum",
    earnedPoints: "Points Earned",
    redeemPoints: "Redeem Points",

    // Promo codes
    promoCode: "Promo Code",
    discount: "Discount",
    validFrom: "Valid From",
    validTo: "Valid To",
    usageLimit: "Usage Limit",
    minAmount: "Minimum Amount",

    // Messages
    bookingSuccess: "Booking successful!",
    bookingError: "Booking error",
    paymentSuccess: "Payment successful!",
    paymentError: "Payment error",
    loginSuccess: "Login successful!",
    loginError: "Login error",
    registrationSuccess: "Registration successful!",
    registrationError: "Registration error",
  }
};

export function useTranslation() {
  const { language } = useLanguageStore();
  
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return { t, language };
}

export function formatDate(date: string | Date, language: Language = 'vi'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (language === 'vi') {
    return dateObj.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } else {
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

export function formatPrice(price: string | number, language: Language = 'vi'): string {
  const amount = typeof price === 'string' ? parseFloat(price) : price;
  
  if (language === 'vi') {
    return amount.toLocaleString('vi-VN') + 'đ';
  } else {
    return amount.toLocaleString('en-US') + ' VND';
  }
}

export function formatNumber(number: number, language: Language = 'vi'): string {
  if (language === 'vi') {
    return number.toLocaleString('vi-VN');
  } else {
    return number.toLocaleString('en-US');
  }
}