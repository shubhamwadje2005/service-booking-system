export type UserRole = "ADMIN" | "CUSTOMER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number; // Duration in minutes
  isActive: boolean;
  image?: string | null;
  customSlots?: string[] | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateServiceDto {
  name: string;
  description?: string | null;
  price: number;
  duration: number;
  isActive?: boolean;
  image?: string | null;
  customSlots?: string[] | null;
}

export interface UpdateServiceDto {
  name?: string;
  description?: string | null;
  price?: number;
  duration?: number;
  isActive?: boolean;
  image?: string | null;
  customSlots?: string[] | null;
}

export type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export interface Booking {
  id: string;
  customerId: string;
  serviceId: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  amount: number;
  status: BookingStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
  customer?: Pick<User, "id" | "name" | "email"> | undefined;
  service?: Pick<Service, "id" | "name" | "duration" | "price"> | undefined;
}

export interface CreateBookingDto {
  serviceId: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
}

export interface AvailabilitySlot {
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isAvailable: boolean;
  available?: boolean;
}

export interface AvailabilityResponse {
  serviceId: string;
  serviceName: string;
  duration: number;
  date: string;
  workingHours?: {
    start: string;
    end: string;
  };
  slots: AvailabilitySlot[];
}

export interface DashboardStats {
  totalServices?: number;
  activeServices: number;
  totalCustomers: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  todayBookings?: number;
  upcomingBookings?: number;
  recentBookings?: Booking[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminBookingsQueryParams {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  date?: string;
  serviceId?: string;
  search?: string;
}

export interface UpdateBookingStatusDto {
  status: BookingStatus;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface ApiResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Auth API DTO Aliases (supporting modular auth.api.ts conventions)
export type LOGIN_REQUEST = LoginDto;
export type LOGIN_RESPONSE = ApiResponse<User>;
export type LOGOUT_REQUEST = void;
export type LOGOUT_RESPONSE = ApiResponse<void>;
export type ME_REQUEST = void;
export type ME_RESPONSE = ApiResponse<User>;
export type REGISTER_REQUEST = RegisterDto;
export type REGISTER_RESPONSE = ApiResponse<User>;


