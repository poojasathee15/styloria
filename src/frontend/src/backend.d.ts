import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AdminStats {
    pendingCount: bigint;
    cancelledCount: bigint;
    totalBookings: bigint;
    completedCount: bigint;
    confirmedCount: bigint;
    totalRevenue: bigint;
}
export interface Service {
    id: bigint;
    name: string;
    description: string;
    isActive: boolean;
    imageUrl: string;
    durationMinutes: bigint;
    category: ServiceCategory;
    price: bigint;
}
export interface Payment {
    id: bigint;
    status: PaymentStatus;
    amount: bigint;
    appointmentId: bigint;
}
export interface Appointment {
    id: bigint;
    status: AppointmentStatus;
    userId: Principal;
    date: string;
    notes: string;
    serviceId: bigint;
    timeSlot: string;
}
export interface UserProfile {
    id: Principal;
    name: string;
    role: UserRole;
    email: string;
    phone: string;
}
export enum AppointmentStatus {
    cancelled = "cancelled",
    pending = "pending",
    completed = "completed",
    confirmed = "confirmed"
}
export enum PaymentStatus {
    pending = "pending",
    completed = "completed",
    failed = "failed"
}
export enum ServiceCategory {
    bridal = "bridal",
    hair = "hair",
    nails = "nails",
    makeup = "makeup",
    facial = "facial"
}
export enum UserRole {
    admin = "admin",
    user = "user"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    completePayment(paymentId: bigint): Promise<void>;
    createAppointment(serviceId: bigint, date: string, timeSlot: string, notes: string): Promise<bigint>;
    createPayment(appointmentId: bigint, amount: bigint): Promise<bigint>;
    createService(name: string, category: ServiceCategory, price: bigint, durationMinutes: bigint, description: string, imageUrl: string, isActive: boolean): Promise<bigint>;
    deleteService(serviceId: bigint): Promise<void>;
    getAdminStats(): Promise<AdminStats>;
    getAppointment(appointmentId: bigint): Promise<Appointment | null>;
    getAvailableTimeSlots(date: string): Promise<Array<string>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getPayment(paymentId: bigint): Promise<Payment | null>;
    getPaymentByAppointment(appointmentId: bigint): Promise<Payment | null>;
    getService(serviceId: bigint): Promise<Service | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listAllAppointments(): Promise<Array<Appointment>>;
    listMyAppointments(): Promise<Array<Appointment>>;
    listServices(): Promise<Array<Service>>;
    saveCallerUserProfile(name: string, phone: string, email: string): Promise<void>;
    updateAppointmentStatus(appointmentId: bigint, status: AppointmentStatus): Promise<void>;
    updateService(serviceId: bigint, name: string, category: ServiceCategory, price: bigint, durationMinutes: bigint, description: string, imageUrl: string, isActive: boolean): Promise<void>;
}
