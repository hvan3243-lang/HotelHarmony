import { create } from "zustand";
import { persist } from "zustand/middleware";

// Language interface
export interface Language {
  code: string;
  name: string;
  flag: string;
}

// Available languages
export const languages: Language[] = [
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", name: "English", flag: "🇺🇸" },
];

// Translation keys interface
export interface Translations {
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    save: string;
    edit: string;
    delete: string;
    view: string;
    back: string;
    next: string;
    previous: string;
    submit: string;
    search: string;
    filter: string;
    clear: string;
    refresh: string;
    close: string;
    confirm: string;
    yes: string;
    no: string;
  };

  // Navigation
  nav: {
    home: string;
    rooms: string;
    booking: string;
    services: string;
    blog: string;
    contact: string;
    about: string;
    login: string;
    register: string;
    logout: string;
    admin: string;
    customer: string;
    language: string;
  };

  // Authentication
  auth: {
    login: string;
    register: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    rememberMe: string;
    forgotPassword: string;
    loginSuccess: string;
    loginFailed: string;
    registerSuccess: string;
    registerFailed: string;
    invalidEmail: string;
    passwordRequired: string;
    nameRequired: string;
    phoneRequired: string;
    emailExists: string;
    invalidCredentials: string;
    welcomeMessage: string;
    createAccount: string;
    haveAccount: string;
    noAccount: string;
    loginToContinue: string;
    preferences: string;
  };

  // Booking
  booking: {
    title: string;
    checkIn: string;
    checkOut: string;
    checkInTime: string;
    checkOutTime: string;
    guests: string;
    roomType: string;
    totalPrice: string;
    bookNow: string;
    bookingConfirmed: string;
    bookingFailed: string;
    specialRequests: string;
    paymentMethod: string;
    bookingHistory: string;
    status: {
      pending: string;
      depositPaid: string;
      confirmed: string;
      completed: string;
      cancelled: string;
    };
    cancel: string;
    cancelConfirm: string;
    refundPolicy: string;
    review: string;
    rebook: string;
    viewDetails: string;
    bookingCode: string;
    guestInfo: string;
    roomInfo: string;
    paymentInfo: string;
    deposit: string;
    remaining: string;
    walkIn: string;
  };

  // Rooms
  rooms: {
    title: string;
    available: string;
    unavailable: string;
    capacity: string;
    amenities: string;
    price: string;
    perNight: string;
    viewDetails: string;
    book: string;
    images: string;
    description: string;
    rating: string;
    reviews: string;
    roomNumber: string;
    roomType: {
      standard: string;
      deluxe: string;
      suite: string;
      presidential: string;
    };
    featured: string;
    featuredDescription: string;
  };

  // Reviews
  reviews: {
    title: string;
    writeReview: string;
    rating: string;
    comment: string;
    cleanliness: string;
    service: string;
    amenities: string;
    valueForMoney: string;
    location: string;
    wouldRecommend: string;
    guestType: string;
    stayPurpose: string;
    submitReview: string;
    reviewSuccess: string;
    reviewFailed: string;
    averageRating: string;
    totalReviews: string;
    guestTypes: {
      individual: string;
      couple: string;
      family: string;
      business: string;
      group: string;
    };
    purposes: {
      leisure: string;
      business: string;
      family: string;
      romantic: string;
      adventure: string;
    };
  };

  // Payment
  payment: {
    title: string;
    method: string;
    creditCard: string;
    bankTransfer: string;
    qrCode: string;
    cash: string;
    amount: string;
    total: string;
    deposit: string;
    remaining: string;
    payNow: string;
    paymentSuccess: string;
    paymentFailed: string;
    processing: string;
    confirmed: string;
    refund: string;
    refundAmount: string;
    refundReason: string;
  };

  // Admin
  admin: {
    dashboard: string;
    stats: string;
    totalRooms: string;
    totalBookings: string;
    occupancyRate: string;
    revenue: string;
    newCustomers: string;
    roomManagement: string;
    bookingManagement: string;
    serviceManagement: string;
    customerManagement: string;
    reports: string;
    settings: string;
    addRoom: string;
    editRoom: string;
    deleteRoom: string;
    addService: string;
    editService: string;
    deleteService: string;
    viewBooking: string;
    confirmBooking: string;
    cancelBooking: string;
    customerSupport: string;
    messages: string;
    contactMessages: string;
    blogManagement: string;
    walkInBooking: string;
    export: string;
    chartData: string;
  };

  // Customer
  customer: {
    profile: string;
    bookingHistory: string;
    preferences: string;
    loyalty: string;
    points: string;
    level: string;
    rewards: string;
    personalInfo: string;
    contactInfo: string;
    changePassword: string;
    notifications: string;
    privacy: string;
    totalBookings: string;
    completedStays: string;
    memberSince: string;
    vipStatus: string;
    recommendations: string;
    vip: string;
    editProfile: string;
    updateProfile: string;
  };

  // Contact
  contact: {
    title: string;
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    send: string;
    sendSuccess: string;
    sendFailed: string;
    address: string;
    hours: string;
    socialMedia: string;
    faq: string;
    support: string;
    emergency: string;
  };

  // Error messages
  error: {
    notFound: string;
    serverError: string;
    networkError: string;
    unauthorized: string;
    forbidden: string;
    validationError: string;
    requiredField: string;
    invalidFormat: string;
    tryAgain: string;

  common: {
    loading: "Đang tải...",
    error: "Lỗi",
    success: "Thành công",
    cancel: "Hủy",
    save: "Lưu",
    edit: "Sửa",
    delete: "Xóa",
    view: "Xem",
    back: "Quay lại",
    next: "Tiếp theo",
    previous: "Trước đó",
    submit: "Gửi",
    search: "Tìm kiếm",
    filter: "Lọc",
    clear: "Xóa",
    refresh: "Làm mới",
    close: "Đóng",
    confirm: "Xác nhận",
    yes: "Có",
    no: "Không",
  },

  nav: {
    home: "Trang chủ",
    rooms: "Phòng",
    booking: "Đặt phòng",
    services: "Dịch vụ",
    blog: "Blog",
    contact: "Liên hệ",
    about: "Giới thiệu",
    login: "Đăng nhập",
    register: "Đăng ký",
    logout: "Đăng xuất",
    admin: "Quản trị",
    customer: "Khách hàng",
    language: "Ngôn ngữ",
  },

  auth: {
    login: "Đăng nhập",
    register: "Đăng ký",
    email: "Email",
    password: "Mật khẩu",
    firstName: "Họ",
    lastName: "Tên",
    phone: "Số điện thoại",
    rememberMe: "Ghi nhớ đăng nhập",
    forgotPassword: "Quên mật khẩu?",
    loginSuccess: "Đăng nhập thành công",
    loginFailed: "Đăng nhập thất bại",
    registerSuccess: "Đăng ký thành công",
    registerFailed: "Đăng ký thất bại",
    invalidEmail: "Email không hợp lệ",
    passwordRequired: "Mật khẩu phải có ít nhất 6 ký tự",
    nameRequired: "Họ tên không được để trống",
    phoneRequired: "Số điện thoại không hợp lệ",
    emailExists: "Email đã được sử dụng",
    invalidCredentials: "Email hoặc mật khẩu không đúng",
    welcomeMessage: "Chào mừng bạn đến với HotelLux!",
    createAccount: "Tạo tài khoản mới",
    haveAccount: "Đã có tài khoản?",
    noAccount: "Chưa có tài khoản?",
    loginToContinue: "Đăng nhập để tiếp tục",
    preferences: "Sở thích",
  },

  booking: {
    title: "Đặt phòng",
    checkIn: "Ngày nhận phòng",
    checkOut: "Ngày trả phòng",
    checkInTime: "Giờ nhận phòng",
    checkOutTime: "Giờ trả phòng",
    guests: "Số khách",
    roomType: "Loại phòng",
    totalPrice: "Tổng tiền",
    bookNow: "Đặt ngay",
    bookingConfirmed: "Đặt phòng thành công",
    bookingFailed: "Đặt phòng thất bại",
    specialRequests: "Yêu cầu đặc biệt",
    paymentMethod: "Phương thức thanh toán",
    bookingHistory: "Lịch sử đặt phòng",
    status: {
      pending: "Đang chờ",
      depositPaid: "Đã đặt cọc",
      confirmed: "Đã xác nhận",
      completed: "Đã hoàn thành",
      cancelled: "Đã hủy",
    },
    cancel: "Hủy",
    cancelConfirm: "Bạn có chắc chắn muốn hủy đặt phòng này?",
    refundPolicy: "Chính sách hoàn tiền",
    review: "Đánh giá",
    rebook: "Đặt lại",
    viewDetails: "Xem chi tiết",
    bookingCode: "Mã đặt phòng",
    guestInfo: "Thông tin khách",
    roomInfo: "Thông tin phòng",
    paymentInfo: "Thông tin thanh toán",
    deposit: "Đặt cọc",
    remaining: "Còn lại",
    walkIn: "Walk-in",
  },

  rooms: {
    title: "Phòng nghỉ",
    available: "Có sẵn",
    unavailable: "Không có sẵn",
    capacity: "Sức chứa",
    amenities: "Tiện nghi",
    price: "Giá",
    perNight: "mỗi đêm",
    viewDetails: "Xem chi tiết",
    book: "Đặt phòng",
    images: "Hình ảnh",
    description: "Mô tả",
    rating: "Đánh giá",
    reviews: "nhận xét",
    roomNumber: "Số phòng",
    roomType: {
      standard: "Tiêu chuẩn",
      deluxe: "Cao cấp",
      suite: "Suite",
      presidential: "Tổng thống",
    },
    featured: "Phòng nổi bật",
    featuredDescription: "Khám phá những phòng nghỉ sang trọng nhất của chúng tôi",
  },

  reviews: {
    title: "Đánh giá",
    writeReview: "Viết đánh giá",
    rating: "Xếp hạng",
    comment: "Nhận xét",
    cleanliness: "Sạch sẽ",
    service: "Dịch vụ",
    amenities: "Tiện nghi",
    valueForMoney: "Giá trị tiền bạc",
    location: "Vị trí",
    wouldRecommend: "Khuyến nghị",
    guestType: "Loại khách",
    stayPurpose: "Mục đích lưu trú",
    submitReview: "Gửi đánh giá",
    reviewSuccess: "Đánh giá thành công",
    reviewFailed: "Đánh giá thất bại",
    averageRating: "Đánh giá trung bình",
    totalReviews: "Tổng đánh giá",
    guestTypes: {
      individual: "Cá nhân",
      couple: "Cặp đôi",
      family: "Gia đình",
      business: "Công việc",
      group: "Nhóm",
    },
    purposes: {
      leisure: "Giải trí",
      business: "Công việc",
      family: "Gia đình",
      romantic: "Lãng mạn",
      adventure: "Phiêu lưu",
    },
  },

  payment: {
    title: "Thanh toán",
    method: "Phương thức",
    creditCard: "Thẻ tín dụng",
    bankTransfer: "Chuyển khoản",
    qrCode: "Mã QR",
    cash: "Tiền mặt",
    amount: "Số tiền",
    total: "Tổng cộng",
    deposit: "Đặt cọc",
    remaining: "Còn lại",
    payNow: "Thanh toán ngay",
    paymentSuccess: "Thanh toán thành công",
    paymentFailed: "Thanh toán thất bại",
    processing: "Đang xử lý",
    confirmed: "Đã xác nhận",
    refund: "Hoàn tiền",
    refundAmount: "Số tiền hoàn",
    refundReason: "Lý do hoàn tiền",
  },

  admin: {
    dashboard: "Bảng điều khiển",
    stats: "Thống kê",
    totalRooms: "Tổng số phòng",
    totalBookings: "Tổng đặt phòng",
    occupancyRate: "Tỷ lệ lấp đầy",
    revenue: "Doanh thu",
    newCustomers: "Khách hàng mới",
    roomManagement: "Quản lý phòng",
    bookingManagement: "Quản lý đặt phòng",
    serviceManagement: "Quản lý dịch vụ",
    customerManagement: "Quản lý khách hàng",
    reports: "Báo cáo",
    settings: "Cài đặt",
    addRoom: "Thêm phòng",
    editRoom: "Sửa phòng",
    deleteRoom: "Xóa phòng",
    addService: "Thêm dịch vụ",
    editService: "Sửa dịch vụ",
    deleteService: "Xóa dịch vụ",
    viewBooking: "Xem đặt phòng",
    confirmBooking: "Xác nhận đặt phòng",
    cancelBooking: "Hủy đặt phòng",
    customerSupport: "Hỗ trợ khách hàng",
    messages: "Tin nhắn",
    contactMessages: "Tin nhắn liên hệ",
    blogManagement: "Quản lý blog",
    walkInBooking: "Đặt phòng Walk-in",
    export: "Xuất dữ liệu",
    chartData: "Dữ liệu biểu đồ",
  },

  customer: {
    profile: "Hồ sơ",
    bookingHistory: "Lịch sử đặt phòng",
    preferences: "Sở thích",
    loyalty: "Khách hàng thân thiết",
    points: "Điểm",
    level: "Cấp độ",
    rewards: "Phần thưởng",
    personalInfo: "Thông tin cá nhân",
    contactInfo: "Thông tin liên hệ",
    changePassword: "Đổi mật khẩu",
    notifications: "Thông báo",
    privacy: "Quyền riêng tư",
    totalBookings: "đặt phòng",
    completedStays: "lần lưu trú",
    memberSince: "Tham gia",
    vip: "Khách hàng VIP",
    editProfile: "Chỉnh sửa thông tin",
    updateProfile: "Cập nhật thông tin cá nhân",
    vipStatus: "Trạng thái VIP",
    recommendations: "Gợi ý",
  },

  contact: {
    title: "Liên hệ",
    name: "Họ tên",
    email: "Email",
    phone: "Số điện thoại",
    subject: "Chủ đề",
    message: "Tin nhắn",
    send: "Gửi",
    sendSuccess: "Gửi thành công",
    sendFailed: "Gửi thất bại",
    address: "Địa chỉ",
    hours: "Giờ làm việc",
    socialMedia: "Mạng xã hội",
    faq: "Câu hỏi thường gặp",
    support: "Hỗ trợ",
    emergency: "Khẩn cấp",
  },

  error: {
    notFound: "Không tìm thấy",
    serverError: "Lỗi máy chủ",
    networkError: "Lỗi mạng",
    unauthorized: "Không có quyền",
    forbidden: "Bị cấm",
    validationError: "Lỗi xác thực",
    requiredField: "Trường bắt buộc",
    invalidFormat: "Định dạng không hợp lệ",
    tryAgain: "Thử lại",
  },

  success: {
    saved: "Đã lưu",
    updated: "Đã cập nhật",
    deleted: "Đã xóa",
    created: "Đã tạo",
    sent: "Đã gửi",
    confirmed: "Đã xác nhận",
    cancelled: "Đã hủy",
    completed: "Đã hoàn thành",
  },
};

// English translations
const en: Translations = {
  common: {
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    back: "Back",
    next: "Next",
    previous: "Previous",
    submit: "Submit",
    search: "Search",
    filter: "Filter",
    clear: "Clear",
    refresh: "Refresh",
    close: "Close",
    confirm: "Confirm",
    yes: "Yes",
    no: "No",
  },

  nav: {
    home: "Home",
    rooms: "Rooms",
    booking: "Booking",
    services: "Services",
    blog: "Blog",
    contact: "Contact",
    about: "About",
    login: "Login",
    register: "Register",
    logout: "Logout",
    admin: "Admin",
    customer: "Customer",
    language: "Language",
  },

  auth: {
    login: "Login",
    register: "Register",
    email: "Email",
    password: "Password",
    firstName: "First Name",
    lastName: "Last Name",
    phone: "Phone Number",
    rememberMe: "Remember me",
    forgotPassword: "Forgot password?",
    loginSuccess: "Login successful",
    loginFailed: "Login failed",
    registerSuccess: "Registration successful",
    registerFailed: "Registration failed",
    invalidEmail: "Invalid email",
    passwordRequired: "Password must be at least 6 characters",
    nameRequired: "Name is required",
    phoneRequired: "Invalid phone number",
    emailExists: "Email already exists",
    invalidCredentials: "Invalid email or password",
    welcomeMessage: "Welcome to HotelLux!",
    createAccount: "Create new account",
    haveAccount: "Already have an account?",
    noAccount: "Don't have an account?",
    loginToContinue: "Login to continue",
    preferences: "Preferences",
  },

  booking: {
    title: "Booking",
    checkIn: "Check-in Date",
    checkOut: "Check-out Date",
    checkInTime: "Check-in Time",
    checkOutTime: "Check-out Time",
    guests: "Guests",
    roomType: "Room Type",
    totalPrice: "Total Price",
    bookNow: "Book Now",
    bookingConfirmed: "Booking confirmed",
    bookingFailed: "Booking failed",
    specialRequests: "Special Requests",
    paymentMethod: "Payment Method",
    bookingHistory: "Booking History",
    status: {
      pending: "Pending",
      depositPaid: "Deposit Paid",
      confirmed: "Confirmed",
      completed: "Completed",
      cancelled: "Cancelled",
    },
    cancel: "Cancel",
    cancelConfirm: "Are you sure you want to cancel this booking?",
    refundPolicy: "Refund Policy",
    review: "Review",
    rebook: "Rebook",
    viewDetails: "View Details",
    bookingCode: "Booking Code",
    guestInfo: "Guest Information",
    roomInfo: "Room Information",
    paymentInfo: "Payment Information",
    deposit: "Deposit",
    remaining: "Remaining",
    walkIn: "Walk-in",
  },

  rooms: {
    title: "Rooms",
    available: "Available",
    unavailable: "Unavailable",
    capacity: "Capacity",
    amenities: "Amenities",
    price: "Price",
    perNight: "per night",
    viewDetails: "View Details",
    book: "Book",
    images: "Images",
    description: "Description",
    rating: "Rating",
    reviews: "reviews",
    roomNumber: "Room Number",
    roomType: {
      standard: "Standard",
      deluxe: "Deluxe",
      suite: "Suite",
      presidential: "Presidential",
    },
    featured: "Featured Rooms",
    featuredDescription: "Discover our most luxurious accommodations",
  },

  reviews: {
    title: "Reviews",
    writeReview: "Write Review",
    rating: "Rating",
    comment: "Comment",
    cleanliness: "Cleanliness",
    service: "Service",
    amenities: "Amenities",
    valueForMoney: "Value for Money",
    location: "Location",
    wouldRecommend: "Would Recommend",
    guestType: "Guest Type",
    stayPurpose: "Stay Purpose",
    submitReview: "Submit Review",
    reviewSuccess: "Review submitted successfully",
    reviewFailed: "Review submission failed",
    averageRating: "Average Rating",
    totalReviews: "Total Reviews",
    guestTypes: {
      individual: "Individual",
      couple: "Couple",
      family: "Family",
      business: "Business",
      group: "Group",
    },
    purposes: {
      leisure: "Leisure",
      business: "Business",
      family: "Family",
      romantic: "Romantic",
      adventure: "Adventure",
    },
  },

  payment: {
    title: "Payment",
    method: "Method",
    creditCard: "Credit Card",
    bankTransfer: "Bank Transfer",
    qrCode: "QR Code",
    cash: "Cash",
    amount: "Amount",
    total: "Total",
    deposit: "Deposit",
    remaining: "Remaining",
    payNow: "Pay Now",
    paymentSuccess: "Payment successful",
    paymentFailed: "Payment failed",
    processing: "Processing",
    confirmed: "Confirmed",
    refund: "Refund",
    refundAmount: "Refund Amount",
    refundReason: "Refund Reason",
  },

  admin: {
    dashboard: "Dashboard",
    stats: "Statistics",
    totalRooms: "Total Rooms",
    totalBookings: "Total Bookings",
    occupancyRate: "Occupancy Rate",
    revenue: "Revenue",
    newCustomers: "New Customers",
    roomManagement: "Room Management",
    bookingManagement: "Booking Management",
    serviceManagement: "Service Management",
    customerManagement: "Customer Management",
    reports: "Reports",
    settings: "Settings",
    addRoom: "Add Room",
    editRoom: "Edit Room",
    deleteRoom: "Delete Room",
    addService: "Add Service",
    editService: "Edit Service",
    deleteService: "Delete Service",
    viewBooking: "View Booking",
    confirmBooking: "Confirm Booking",
    cancelBooking: "Cancel Booking",
    customerSupport: "Customer Support",
    messages: "Messages",
    contactMessages: "Contact Messages",
    blogManagement: "Blog Management",
    walkInBooking: "Walk-in Booking",
    export: "Export",
    chartData: "Chart Data",
  },

  customer: {
    profile: "Profile",
    bookingHistory: "Booking History",
    preferences: "Preferences",
    loyalty: "Loyalty",
    points: "Points",
    level: "Level",
    rewards: "Rewards",
    personalInfo: "Personal Information",
    contactInfo: "Contact Information",
    changePassword: "Change Password",
    notifications: "Notifications",
    privacy: "Privacy",
    totalBookings: "bookings",
    completedStays: "stays",
    memberSince: "Member Since",
    vipStatus: "VIP Status",
    recommendations: "Recommendations",
    vip: "VIP Customer",
    editProfile: "Edit Profile",
    updateProfile: "Update Personal Information",
  },

  contact: {
    title: "Contact",
    name: "Name",
    email: "Email",
    phone: "Phone",
    subject: "Subject",
    message: "Message",
    send: "Send",
    sendSuccess: "Message sent successfully",
    sendFailed: "Failed to send message",
    address: "Address",
    hours: "Business Hours",
    socialMedia: "Social Media",
    faq: "FAQ",
    support: "Support",
    emergency: "Emergency",
  },

  error: {
    notFound: "Not Found",
    serverError: "Server Error",
    networkError: "Network Error",
    unauthorized: "Unauthorized",
    forbidden: "Forbidden",
    validationError: "Validation Error",
    requiredField: "Required Field",
    invalidFormat: "Invalid Format",
    tryAgain: "Try Again",
  },

  success: {
    saved: "Saved",
    updated: "Updated",
    deleted: "Deleted",
    created: "Created",
    sent: "Sent",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    completed: "Completed",
  },
};

// Translation map
const translations: Record<string, Translations> = {
  vi,
  en,
};

// Language store interface
interface LanguageStore {
  currentLanguage: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
}

// Create language store with persistence
export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      currentLanguage: "vi", // Default to Vietnamese
      
      setLanguage: (language: string) => {
        if (languages.find(l => l.code === language)) {
          set({ currentLanguage: language });
        }
      },

      t: (key: string) => {
        const { currentLanguage } = get();
        const translation = translations[currentLanguage];
        
        if (!translation) return key;
        
        // Navigate through nested object using dot notation
        const keys = key.split('.');
        let value: any = translation;
        
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            return key; // Return key if translation not found
          }
        }
        
        return typeof value === 'string' ? value : key;
      },
    }),
    {
      name: 'hotellux-language',
      version: 1,
    }
  )
);

// Helper hook for translations
export const useTranslation = () => {
  const { t, currentLanguage, setLanguage } = useLanguageStore();
  const currentLang = languages.find(l => l.code === currentLanguage);
  
  return {
    t,
    currentLanguage,
    currentLang,
    setLanguage,
    languages,
  };
};

// Format date based on language
export const formatDate = (date: string | Date, language: string = 'vi') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (language === 'en') {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  
  return dateObj.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
};

// Format currency based on language
export const formatCurrency = (amount: number, language: string = 'vi') => {
  if (language === 'en') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount / 25000); // Convert VND to USD (approximate rate)
  }
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
};