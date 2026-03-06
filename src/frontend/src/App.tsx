import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  Edit3,
  Home,
  Images,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Scissors,
  Shield,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  AdminStats,
  Appointment,
  GalleryPhoto,
  Service,
  UserProfile,
} from "./backend.d";
import { AppointmentStatus, ServiceCategory, UserRole__1 } from "./backend.d";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type Screen =
  | "login"
  | "register"
  | "admin-login"
  | "profile-setup"
  | "home"
  | "services"
  | "service-detail"
  | "booking"
  | "payment"
  | "payment-success"
  | "bookings"
  | "gallery"
  | "profile"
  | "admin";

interface BookingState {
  service: Service | null;
  date: string;
  timeSlot: string;
  notes: string;
  appointmentId: bigint | null;
  paymentId: bigint | null;
  amount: bigint;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const getCategoryGradient = (category: ServiceCategory | string): string => {
  switch (category) {
    case ServiceCategory.hair:
      return "gradient-hair";
    case ServiceCategory.makeup:
      return "gradient-makeup";
    case ServiceCategory.skin:
      return "gradient-skin";
    case ServiceCategory.nails:
      return "gradient-nails";
    case "bridal":
      return "gradient-bridal";
    case "other":
      return "gradient-facial";
    default:
      return "gradient-pink";
  }
};

const getCategoryLabel = (category: ServiceCategory | string): string => {
  const labels: Record<string, string> = {
    hair: "Hair",
    makeup: "Makeup",
    skin: "Skin",
    nails: "Nails",
    bridal: "Bridal",
    other: "Other",
  };
  return labels[category] ?? String(category);
};

const formatPrice = (price: bigint): string =>
  `₹${Number(price).toLocaleString("en-IN")}`;

const formatDuration = (minutes: bigint): string => {
  const m = Number(minutes);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
};

const getStatusBadgeClass = (status: string): string => {
  const map: Record<string, string> = {
    confirmed: "badge-confirmed",
    pending: "badge-pending",
    completed: "badge-completed",
    cancelled: "badge-cancelled",
  };
  return map[status] ?? "badge-pending";
};

const getNext14Days = (): { label: string; value: string; day: string }[] => {
  const result: { label: string; value: string; day: string }[] = [];
  const now = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    const label = i === 0 ? "Today" : i === 1 ? "Tmrw" : `${d.getDate()}`;
    result.push({ label, value: iso, day: dayNames[d.getDay()] });
  }
  return result;
};

const getInitials = (name: string): string =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// ─────────────────────────────────────────────────────────────
// Notification Bell
// ─────────────────────────────────────────────────────────────
function NotificationBell({ appointments }: { appointments: Appointment[] }) {
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const upcoming = appointments.filter(
    (a) =>
      a.date >= today &&
      (a.status === AppointmentStatus.pending ||
        a.status === AppointmentStatus.confirmed),
  );

  return (
    <>
      <button
        type="button"
        data-ocid="notifications.open_modal_button"
        onClick={() => setOpen(true)}
        className="relative w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4.5 h-4.5" />
        {upcoming.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
            {upcoming.length > 9 ? "9+" : upcoming.length}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          data-ocid="notifications.sheet"
          className="rounded-t-3xl max-h-[70vh] overflow-y-auto"
        >
          <SheetHeader className="pb-3 border-b border-pink-100">
            <SheetTitle className="font-display text-lg text-foreground flex items-center gap-2">
              <Bell className="w-4.5 h-4.5 text-primary" />
              Notifications
              {upcoming.length > 0 && (
                <span className="ml-auto text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {upcoming.length} upcoming
                </span>
              )}
            </SheetTitle>
          </SheetHeader>
          <div className="pt-4 space-y-3">
            {upcoming.length === 0 ? (
              <div
                data-ocid="notifications.empty_state"
                className="text-center py-10"
              >
                <Bell className="w-10 h-10 text-pink-200 mx-auto mb-3" />
                <p className="font-semibold text-foreground text-sm">
                  No upcoming appointments
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Book a service to see it here
                </p>
              </div>
            ) : (
              upcoming.map((appt, i) => (
                <div
                  key={String(appt.id)}
                  data-ocid={`notifications.item.${i + 1}`}
                  className="bg-pink-50 rounded-2xl p-3 flex items-start gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-none mt-0.5">
                    <CalendarDays className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">
                      Service #{String(appt.serviceId)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {appt.date}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {appt.timeSlot}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-full flex-none ${getStatusBadgeClass(appt.status)}`}
                  >
                    {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                  </span>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Styloria Logo
// ─────────────────────────────────────────────────────────────
function StyloriaLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-xl", md: "text-2xl", lg: "text-3xl" };
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-7 h-7 rounded-full gradient-pink flex items-center justify-center shadow-pink">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <span className={`font-display font-bold text-primary ${sizes[size]}`}>
        Styloria
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bottom Navigation
// ─────────────────────────────────────────────────────────────
function BottomNav({
  current,
  onNavigate,
}: {
  current: Screen;
  onNavigate: (s: Screen) => void;
}) {
  const items = [
    { screen: "home" as Screen, icon: Home, label: "Home" },
    { screen: "bookings" as Screen, icon: CalendarDays, label: "Bookings" },
    { screen: "services" as Screen, icon: Scissors, label: "Services" },
    { screen: "gallery" as Screen, icon: Images, label: "Gallery" },
    { screen: "profile" as Screen, icon: User, label: "Profile" },
  ];
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-pink-200 z-40">
      <div className="flex items-center justify-around py-1.5">
        {items.map(({ screen, icon: Icon, label }) => {
          const active = current === screen;
          return (
            <button
              type="button"
              key={screen}
              data-ocid={`nav.${label.toLowerCase()}_link`}
              onClick={() => onNavigate(screen)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary/70"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                  active ? "bg-pink-100" : ""
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "stroke-[2.5]" : ""}`} />
              </div>
              <span
                className={`text-[9px] font-medium ${active ? "font-semibold" : ""}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
      {/* Safe area */}
      <div className="h-[env(safe-area-inset-bottom,0px)]" />
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────
// Service Card
// ─────────────────────────────────────────────────────────────
function ServiceCard({
  service,
  onBook,
  onDetail,
  index,
}: {
  service: Service;
  onBook: (s: Service) => void;
  onDetail: (s: Service) => void;
  index: number;
}) {
  return (
    <button
      type="button"
      data-ocid={`home.service.item.${index}`}
      className="bg-white rounded-2xl card-shadow overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-200 text-left w-full"
      onClick={() => onDetail(service)}
    >
      <div
        className={`h-28 ${service.imageUrl ? "" : getCategoryGradient(service.category)} relative overflow-hidden`}
      >
        {service.imageUrl ? (
          <img
            src={service.imageUrl}
            alt={service.name}
            className="w-full h-28 object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className={`absolute inset-0 ${getCategoryGradient(service.category)} flex items-center justify-center`}
          >
            <Scissors className="w-8 h-8 text-white/60" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {getCategoryLabel(service.category)}
          </span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm text-foreground line-clamp-1">
          {service.name}
        </h3>
        <div className="flex items-center gap-1 mt-1 text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span className="text-[11px]">
            {formatDuration(service.durationMinutes)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="font-display font-bold text-primary text-sm">
            {formatPrice(service.price)}
          </span>
          <Button
            size="sm"
            className="h-7 text-[11px] px-3 bg-primary hover:bg-primary/90 text-white rounded-full shadow-pink"
            onClick={(e) => {
              e.stopPropagation();
              onBook(service);
            }}
          >
            Book
          </Button>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Loading Skeleton Card
// ─────────────────────────────────────────────────────────────
function ServiceCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl card-shadow overflow-hidden">
      <Skeleton className="h-28 w-full shimmer" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between items-center mt-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────────────────────────
function LoginScreen({
  onGoRegister: _onGoRegister,
  onGoAdmin,
}: {
  onGoRegister: () => void;
  onLogin?: () => void;
  onGoAdmin: () => void;
}) {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Hero */}
      <div className="gradient-hero px-6 pt-16 pb-12 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold text-white">
            Styloria
          </h1>
          <p className="text-white/80 text-sm mt-1 font-body">
            Your luxury beauty destination
          </p>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className="w-4 h-4 fill-yellow-300 text-yellow-300" />
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 bg-background rounded-t-3xl -mt-4 px-6 pt-8 pb-8">
        <h2 className="font-display text-2xl font-bold text-foreground text-center">
          Welcome Back
        </h2>
        <p className="text-muted-foreground text-sm text-center mt-1 mb-8">
          Sign in to book your beauty appointments
        </p>

        {/* Internet Identity — primary */}
        <Button
          data-ocid="auth.login_button"
          onClick={login}
          disabled={isLoggingIn || isInitializing}
          className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-pink-lg pulse-pink"
        >
          {isLoggingIn ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Shield className="w-5 h-5 mr-2" />
          )}
          {isLoggingIn ? "Connecting…" : "Sign in with Internet Identity"}
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-6">
          New here?{" "}
          <button
            type="button"
            data-ocid="auth.register_link"
            onClick={login}
            className="text-primary font-semibold hover:underline"
            disabled={isLoggingIn || isInitializing}
          >
            Create account
          </button>
        </p>

        <div className="mt-4 pt-4 border-t border-pink-100">
          <button
            type="button"
            data-ocid="auth.admin_login_link"
            onClick={onGoAdmin}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            <Shield className="w-4 h-4" />
            Owner Admin Login
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REGISTER SCREEN
// ─────────────────────────────────────────────────────────────
function RegisterScreen({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const { actor } = useActor();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.saveCallerUserProfile(form.name, form.phone, form.email, "");
    },
    onSuccess: () => {
      toast.success("Account created! Please sign in.");
      onBack();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="gradient-hero px-6 pt-12 pb-8 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-white/80 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <StyloriaLogo size="sm" />
      </div>

      <div className="flex-1 bg-background rounded-t-3xl -mt-3 px-6 pt-8 pb-8">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Complete Your Profile
        </h2>
        <p className="text-muted-foreground text-sm mt-1 mb-6">
          Sign in with Internet Identity first, then complete your profile below
        </p>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="reg-name"
              className="text-xs font-semibold text-foreground mb-1.5 block"
            >
              Full Name
            </label>
            <Input
              id="reg-name"
              data-ocid="auth.name_input"
              placeholder="Priya Sharma"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="rounded-xl border-pink-200 focus:ring-primary h-11"
            />
          </div>
          <div>
            <label
              htmlFor="reg-phone"
              className="text-xs font-semibold text-foreground mb-1.5 block"
            >
              Phone Number
            </label>
            <Input
              id="reg-phone"
              data-ocid="auth.phone_input"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
              className="rounded-xl border-pink-200 focus:ring-primary h-11"
            />
          </div>
          <div>
            <label
              htmlFor="reg-email"
              className="text-xs font-semibold text-foreground mb-1.5 block"
            >
              Email Address
            </label>
            <Input
              id="reg-email"
              data-ocid="auth.email_input"
              type="email"
              placeholder="priya@example.com"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              className="rounded-xl border-pink-200 focus:ring-primary h-11"
            />
          </div>
        </div>

        <Button
          data-ocid="auth.submit_button"
          className="w-full h-12 mt-6 text-base font-semibold bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-pink"
          onClick={() => mutation.mutate()}
          disabled={
            mutation.isPending || !form.name || !form.phone || !form.email
          }
        >
          {mutation.isPending ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : null}
          Save Profile
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onBack}
            className="text-primary font-semibold hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROFILE SETUP SCREEN (after II login, no profile)
// ─────────────────────────────────────────────────────────────
function ProfileSetupScreen({ onComplete }: { onComplete: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const { actor } = useActor();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.saveCallerUserProfile(form.name, form.phone, form.email, "");
    },
    onSuccess: () => {
      toast.success("Profile set up successfully!");
      onComplete();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full gradient-pink mx-auto mb-4 flex items-center justify-center shadow-pink">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Complete Your Profile
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Just a few details to get you started
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="setup-name"
              className="text-xs font-semibold text-foreground mb-1.5 block"
            >
              Full Name
            </label>
            <Input
              id="setup-name"
              placeholder="Priya Sharma"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="rounded-xl border-pink-200 h-11"
            />
          </div>
          <div>
            <label
              htmlFor="setup-phone"
              className="text-xs font-semibold text-foreground mb-1.5 block"
            >
              Phone
            </label>
            <Input
              id="setup-phone"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
              className="rounded-xl border-pink-200 h-11"
            />
          </div>
          <div>
            <label
              htmlFor="setup-email"
              className="text-xs font-semibold text-foreground mb-1.5 block"
            >
              Email
            </label>
            <Input
              id="setup-email"
              type="email"
              placeholder="priya@example.com"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              className="rounded-xl border-pink-200 h-11"
            />
          </div>
        </div>

        <Button
          className="w-full h-12 mt-6 font-semibold bg-primary text-white rounded-2xl shadow-pink"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !form.name || !form.phone}
        >
          {mutation.isPending ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : null}
          Get Started
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ADMIN LOGIN SCREEN
// ─────────────────────────────────────────────────────────────
function AdminLoginScreen({
  onBack,
  onSuccess,
}: { onBack: () => void; onSuccess: () => void }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setError("");
    setTimeout(() => {
      if (userId === "styloria" && password === "Styloria@1996") {
        onSuccess();
      } else {
        setError(
          "Invalid credentials. Please check your User ID and password.",
        );
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="gradient-hero px-6 pt-12 pb-10 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="self-start text-white/80 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-14 h-14 rounded-2xl bg-charcoal/60 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-white">
            Admin Login
          </h1>
          <p className="text-white/70 text-xs mt-1">Styloria Owner Access</p>
        </div>
      </div>

      <div className="flex-1 bg-background rounded-t-3xl -mt-4 px-6 pt-8 pb-8">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="admin-userid"
              className="text-xs font-semibold text-foreground mb-1.5 block"
            >
              User ID
            </label>
            <Input
              id="admin-userid"
              data-ocid="admin-login.userid_input"
              placeholder="styloria"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="rounded-xl border-pink-200 h-11"
              autoCapitalize="none"
            />
          </div>
          <div>
            <label
              htmlFor="admin-password"
              className="text-xs font-semibold text-foreground mb-1.5 block"
            >
              Password
            </label>
            <Input
              id="admin-password"
              data-ocid="admin-login.password_input"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLogin();
              }}
              className="rounded-xl border-pink-200 h-11"
            />
          </div>
          {error && (
            <div
              data-ocid="admin-login.error_state"
              className="bg-destructive/10 text-destructive text-xs rounded-xl px-3 py-2"
            >
              {error}
            </div>
          )}
        </div>

        <Button
          data-ocid="admin-login.submit_button"
          className="w-full h-12 mt-6 text-base font-semibold bg-charcoal hover:bg-charcoal/90 text-white rounded-2xl"
          onClick={handleLogin}
          disabled={loading || !userId || !password}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Shield className="w-5 h-5 mr-2" />
          )}
          {loading ? "Verifying…" : "Access Admin Panel"}
        </Button>

        <p className="text-center text-[11px] text-muted-foreground mt-5">
          This login is for salon owners only
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HOME SCREEN
// ─────────────────────────────────────────────────────────────
function HomeScreen({
  profile,
  onNavigate,
  onBookService,
  onServiceDetail,
  appointments,
}: {
  profile: UserProfile | null;
  onNavigate: (s: Screen) => void;
  onBookService: (s: Service) => void;
  onServiceDetail: (s: Service) => void;
  appointments: Appointment[];
}) {
  const { actor, isFetching } = useActor();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listServices();
    },
    enabled: !!actor && !isFetching,
  });

  const categories = [
    { id: "all", label: "All" },
    { id: ServiceCategory.hair, label: "Hair" },
    { id: ServiceCategory.makeup, label: "Makeup" },
    { id: ServiceCategory.skin, label: "Skin" },
    { id: ServiceCategory.nails, label: "Nails" },
  ];

  const filtered =
    activeCategory === "all"
      ? services.filter((s) => s.isActive)
      : services.filter((s) => s.isActive && s.category === activeCategory);

  const displayName = profile?.name?.split(" ")[0] ?? "Guest";

  return (
    <div className="pb-24 animate-fade-in">
      {/* Header */}
      <div className="gradient-hero px-5 pt-10 pb-14">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-xs font-body">Welcome back 👋</p>
            <h1 className="font-display text-xl font-bold text-white mt-0.5">
              {displayName}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell appointments={appointments} />
            <StyloriaLogo size="sm" />
          </div>
        </div>
      </div>

      {/* Hero card */}
      <div className="px-4 -mt-8">
        <div className="bg-white rounded-3xl card-shadow-lg p-5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground leading-tight">
              Book Your
              <br />
              Beauty Session
            </h2>
            <p className="text-muted-foreground text-xs mt-1">
              Premium salon services at your fingertips
            </p>
            <Button
              data-ocid="home.book_now_button"
              className="mt-3 h-9 px-5 text-xs font-semibold bg-primary text-white rounded-full shadow-pink pulse-pink"
              onClick={() => onNavigate("booking")}
            >
              Book Now
            </Button>
          </div>
          <div className="w-20 h-20 rounded-2xl gradient-pink flex items-center justify-center shadow-card">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mt-6">
        <h3 className="font-display font-bold text-base text-foreground mb-3">
          Categories
        </h3>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-none px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat.id
                  ? "bg-primary text-white shadow-pink"
                  : "bg-pink-100 text-primary/70 hover:bg-pink-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Services grid */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-base text-foreground">
            {activeCategory === "all"
              ? "Featured Services"
              : getCategoryLabel(activeCategory as ServiceCategory)}
          </h3>
          <button
            type="button"
            onClick={() => onNavigate("services")}
            className="text-primary text-xs font-semibold flex items-center gap-0.5"
          >
            See all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 stagger-children">
            {[1, 2, 3, 4].map((i) => (
              <ServiceCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-10"
            data-ocid="home.service.empty_state"
          >
            <Scissors className="w-10 h-10 text-pink-200 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No services found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 stagger-children">
            {filtered.slice(0, 6).map((service, i) => (
              <ServiceCard
                key={String(service.id)}
                service={service}
                onBook={onBookService}
                onDetail={onServiceDetail}
                index={i + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SERVICES SCREEN
// ─────────────────────────────────────────────────────────────
function ServicesScreen({
  onBookService,
  onServiceDetail,
  appointments,
}: {
  onBookService: (s: Service) => void;
  onServiceDetail: (s: Service) => void;
  appointments: Appointment[];
}) {
  const { actor, isFetching } = useActor();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listServices();
    },
    enabled: !!actor && !isFetching,
  });

  const categories = [
    { id: "all", label: "All" },
    { id: ServiceCategory.hair, label: "Hair" },
    { id: ServiceCategory.makeup, label: "Makeup" },
    { id: ServiceCategory.skin, label: "Skin" },
    { id: ServiceCategory.nails, label: "Nails" },
  ];

  const filtered =
    activeCategory === "all"
      ? services.filter((s) => s.isActive)
      : services.filter((s) => s.isActive && s.category === activeCategory);

  return (
    <div className="pb-24 animate-fade-in">
      {/* Header */}
      <div className="gradient-hero px-5 pt-10 pb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Our Services
            </h1>
            <p className="text-white/70 text-xs mt-1">
              Discover premium beauty treatments
            </p>
          </div>
          <NotificationBell appointments={appointments} />
        </div>
      </div>

      <div className="px-4 -mt-2">
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 pt-4">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-none px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat.id
                  ? "bg-primary text-white shadow-pink"
                  : "bg-pink-100 text-primary/70 hover:bg-pink-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 mt-4 stagger-children">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ServiceCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16" data-ocid="services.empty_state">
            <Scissors className="w-12 h-12 text-pink-200 mx-auto mb-3" />
            <p className="text-muted-foreground">
              No services in this category
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-4 stagger-children">
            {filtered.map((service, i) => (
              <ServiceCard
                key={String(service.id)}
                service={service}
                onBook={onBookService}
                onDetail={onServiceDetail}
                index={i + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SERVICE DETAIL SCREEN
// ─────────────────────────────────────────────────────────────
function ServiceDetailScreen({
  service,
  onBack,
  onBook,
}: {
  service: Service;
  onBack: () => void;
  onBook: (s: Service) => void;
}) {
  return (
    <div className="min-h-dvh flex flex-col animate-fade-in">
      {/* Hero */}
      <div className={`h-56 ${getCategoryGradient(service.category)} relative`}>
        <button
          type="button"
          onClick={onBack}
          className="absolute top-12 left-4 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="absolute inset-0 flex items-center justify-center">
          <Scissors className="w-16 h-16 text-white/30" />
        </div>
        <div className="absolute bottom-4 left-5 right-5">
          <Badge className="bg-white/20 text-white text-[10px] border-0 mb-1">
            {getCategoryLabel(service.category)}
          </Badge>
          <h1 className="font-display text-2xl font-bold text-white">
            {service.name}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-background rounded-t-3xl -mt-3 px-5 pt-6 pb-8">
        {/* Price & duration */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 bg-pink-100 rounded-2xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">Price</p>
            <p className="font-display font-bold text-primary text-lg">
              {formatPrice(service.price)}
            </p>
          </div>
          <div className="flex-1 bg-pink-100 rounded-2xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-0.5">Duration</p>
            <p className="font-semibold text-foreground text-base">
              {formatDuration(service.durationMinutes)}
            </p>
          </div>
        </div>

        {/* Description */}
        <h3 className="font-semibold text-foreground mb-2">
          About this service
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {service.description ||
            "Experience our premium beauty treatment crafted exclusively for you. Our expert stylists use only the finest products to deliver exceptional results."}
        </p>

        {/* Features */}
        <div className="mt-5 space-y-2">
          {[
            "Professional consultation included",
            "Premium products used",
            "Expert stylist assigned",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-none">
                <Check className="w-3 h-3 text-primary" />
              </div>
              <span className="text-sm text-foreground">{f}</span>
            </div>
          ))}
        </div>

        <Button
          className="w-full h-12 mt-6 font-semibold bg-primary text-white rounded-2xl shadow-pink text-base"
          onClick={() => onBook(service)}
        >
          Book Appointment
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BOOKING SCREEN
// ─────────────────────────────────────────────────────────────
function BookingScreen({
  booking,
  onUpdateBooking,
  onBack,
  onProceedToPayment,
}: {
  booking: BookingState;
  onUpdateBooking: (b: Partial<BookingState>) => void;
  onBack: () => void;
  onProceedToPayment: () => void;
}) {
  const { actor, isFetching } = useActor();
  const days = getNext14Days();

  const { data: slots = [], isLoading: loadingSlots } = useQuery<string[]>({
    queryKey: ["slots", booking.date],
    queryFn: async () => {
      if (!actor || !booking.date) return [];
      return actor.getAvailableTimeSlots(booking.date);
    },
    enabled: !!actor && !isFetching && !!booking.date,
  });

  const canProceed = booking.service && booking.date && booking.timeSlot;

  return (
    <div className="min-h-dvh flex flex-col animate-fade-in">
      {/* Header */}
      <div className="gradient-hero px-5 pt-10 pb-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="text-white/80 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-white">
              Book Appointment
            </h1>
            <p className="text-white/70 text-xs">{booking.service?.name}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-background rounded-t-3xl -mt-3 px-5 pt-6 pb-8 space-y-6">
        {/* Service summary */}
        {booking.service && (
          <div className="bg-white rounded-2xl p-4 card-shadow flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl ${getCategoryGradient(booking.service.category)} flex items-center justify-center flex-none`}
            >
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground">
                {booking.service.name}
              </h3>
              <p className="text-muted-foreground text-xs">
                {formatDuration(booking.service.durationMinutes)}
              </p>
            </div>
            <span className="font-display font-bold text-primary text-base">
              {formatPrice(booking.service.price)}
            </span>
          </div>
        )}

        {/* Date selector */}
        <div>
          <h3 className="font-semibold text-foreground mb-3 text-sm">
            Select Date
          </h3>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {days.map((d, i) => (
              <button
                type="button"
                key={d.value}
                data-ocid={`booking.date.item.${i + 1}`}
                onClick={() => onUpdateBooking({ date: d.value, timeSlot: "" })}
                className={`flex-none flex flex-col items-center px-3 py-2.5 rounded-2xl min-w-[52px] transition-all ${
                  booking.date === d.value
                    ? "bg-primary text-white shadow-pink"
                    : "bg-white text-foreground card-shadow"
                }`}
              >
                <span
                  className={`text-[9px] font-medium ${booking.date === d.value ? "text-white/80" : "text-muted-foreground"}`}
                >
                  {d.day}
                </span>
                <span className="text-sm font-bold mt-0.5">{d.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time slots */}
        {booking.date && (
          <div>
            <h3 className="font-semibold text-foreground mb-3 text-sm">
              Select Time
            </h3>
            {loadingSlots ? (
              <div
                className="grid grid-cols-4 gap-2"
                data-ocid="booking.timeslot.loading_state"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Skeleton key={i} className="h-10 rounded-xl shimmer" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div
                className="text-center py-6 bg-white rounded-2xl card-shadow"
                data-ocid="booking.timeslot.empty_state"
              >
                <Clock className="w-8 h-8 text-pink-200 mx-auto mb-2" />
                <p className="text-muted-foreground text-xs">
                  No slots available for this date
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((slot, i) => (
                  <button
                    type="button"
                    key={slot}
                    data-ocid={`booking.timeslot.item.${i + 1}`}
                    onClick={() => onUpdateBooking({ timeSlot: slot })}
                    className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      booking.timeSlot === slot
                        ? "bg-primary text-white shadow-pink"
                        : "bg-white text-foreground card-shadow hover:bg-pink-50"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <h3 className="font-semibold text-foreground mb-2 text-sm">
            Special Notes
          </h3>
          <Textarea
            data-ocid="booking.notes_input"
            placeholder="Any special requests or notes for your stylist…"
            value={booking.notes}
            onChange={(e) => onUpdateBooking({ notes: e.target.value })}
            className="rounded-xl border-pink-200 resize-none text-sm"
            rows={3}
          />
        </div>

        <Button
          data-ocid="booking.proceed_button"
          disabled={!canProceed}
          className="w-full h-12 font-semibold bg-primary text-white rounded-2xl shadow-pink disabled:opacity-50 text-base"
          onClick={onProceedToPayment}
        >
          Proceed to Payment
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAYMENT SCREEN
// ─────────────────────────────────────────────────────────────
function PaymentScreen({
  booking,
  onBack,
  onSuccess,
  profile,
}: {
  booking: BookingState;
  onBack: () => void;
  onSuccess: (appointmentId: bigint, bookingId: string) => void;
  profile: UserProfile | null;
}) {
  const { actor } = useActor();
  const [processing, setProcessing] = useState(false);

  const handlePay = useCallback(async () => {
    if (!actor || !booking.service) return;
    setProcessing(true);
    try {
      // 1. Create appointment
      const appointmentId = await actor.createAppointment(
        booking.service.id,
        booking.date,
        booking.timeSlot,
        booking.notes,
      );
      // 2. Create payment
      const paymentId = await actor.createPayment(
        appointmentId,
        booking.service.price,
      );
      // 3. Simulate payment (complete it)
      await actor.completePayment(paymentId);
      toast.success("Payment successful!");
      onSuccess(
        appointmentId,
        `STYL-${String(appointmentId).padStart(6, "0")}`,
      );
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Payment failed. Please try again.",
      );
    } finally {
      setProcessing(false);
    }
  }, [actor, booking, onSuccess]);

  if (!booking.service) return null;

  return (
    <div className="min-h-dvh flex flex-col animate-fade-in">
      {/* Header */}
      <div className="gradient-hero px-5 pt-10 pb-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="text-white/80 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-white">
              Payment
            </h1>
            <p className="text-white/70 text-xs">Secure checkout</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-background rounded-t-3xl -mt-3 px-5 pt-6 pb-8 space-y-4">
        {/* Order summary */}
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <h3 className="font-semibold text-foreground mb-4">Order Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service</span>
              <span className="font-medium text-foreground">
                {booking.service.name}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">{booking.date}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium">{booking.timeSlot}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">
                {formatDuration(booking.service.durationMinutes)}
              </span>
            </div>
            <div className="h-px bg-pink-100 my-1" />
            <div className="flex justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-display font-bold text-primary text-lg">
                {formatPrice(booking.service.price)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment card UI */}
        <div className="bg-white rounded-2xl p-5 card-shadow">
          <h3 className="font-semibold text-foreground mb-4">Payment Method</h3>
          <div className="gradient-pink rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between mb-4">
              <CreditCard className="w-6 h-6" />
              <span className="text-white/70 text-xs font-semibold">
                SECURE
              </span>
            </div>
            <div className="text-lg font-mono tracking-widest">
              •••• •••• •••• 4242
            </div>
            <div className="flex justify-between mt-3">
              <div>
                <p className="text-white/60 text-[10px]">CARD HOLDER</p>
                <p className="text-sm font-semibold">
                  {profile?.name ?? "Card Holder"}
                </p>
              </div>
              <div>
                <p className="text-white/60 text-[10px]">EXPIRES</p>
                <p className="text-sm font-semibold">12/28</p>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-3">
            🔒 Demo payment — no actual charges
          </p>
        </div>

        <Button
          data-ocid="payment.confirm_button"
          className="w-full h-13 font-semibold bg-primary text-white rounded-2xl shadow-pink-lg text-base py-3.5"
          onClick={handlePay}
          disabled={processing}
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing…
            </>
          ) : (
            `Pay ${formatPrice(booking.service.price)}`
          )}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAYMENT SUCCESS SCREEN
// ─────────────────────────────────────────────────────────────
function PaymentSuccessScreen({
  bookingId,
  onViewBookings,
  onHome,
}: {
  bookingId: string;
  onViewBookings: () => void;
  onHome: () => void;
}) {
  return (
    <div
      data-ocid="payment.success_state"
      className="min-h-dvh flex flex-col items-center justify-center px-6 animate-fade-in"
    >
      {/* Confetti-ish decoration */}
      <div className="relative w-28 h-28 mb-6">
        <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
        <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-pink-lg">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
        </div>
      </div>

      <h2 className="font-display text-3xl font-bold text-foreground text-center">
        Booking Confirmed!
      </h2>
      <p className="text-muted-foreground text-sm text-center mt-2 max-w-xs">
        Your appointment has been successfully booked. See you at the salon!
      </p>

      <div className="bg-pink-100 rounded-2xl px-6 py-4 mt-6 text-center">
        <p className="text-xs text-muted-foreground mb-1">Booking ID</p>
        <p className="font-display font-bold text-primary text-xl tracking-wide">
          {bookingId}
        </p>
      </div>

      <div className="w-full mt-8 space-y-3">
        <Button
          className="w-full h-12 font-semibold bg-primary text-white rounded-2xl shadow-pink"
          onClick={onViewBookings}
        >
          View My Bookings
        </Button>
        <Button
          variant="outline"
          className="w-full h-11 rounded-2xl border-pink-200 text-primary"
          onClick={onHome}
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BOOKINGS SCREEN
// ─────────────────────────────────────────────────────────────
function BookingsScreen({
  onNavigate,
  appointments: appointmentsProp,
}: {
  onNavigate: (s: Screen) => void;
  appointments: Appointment[];
}) {
  const { actor, isFetching } = useActor();

  const { data: appointments = appointmentsProp, isLoading } = useQuery<
    Appointment[]
  >({
    queryKey: ["my-appointments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMyAppointments();
    },
    enabled: !!actor && !isFetching,
  });

  const now = new Date().toISOString().split("T")[0];
  const upcoming = appointments.filter(
    (a) =>
      a.date >= now &&
      a.status !== AppointmentStatus.cancelled &&
      a.status !== AppointmentStatus.completed,
  );
  const past = appointments.filter(
    (a) =>
      a.date < now ||
      a.status === AppointmentStatus.completed ||
      a.status === AppointmentStatus.cancelled,
  );

  const AppointmentCard = ({
    appt,
    index,
  }: { appt: Appointment; index: number }) => (
    <div
      data-ocid={`bookings.item.${index}`}
      className="bg-white rounded-2xl p-4 card-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-foreground truncate">
            Service #{String(appt.serviceId)}
          </h4>
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1 text-muted-foreground">
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="text-xs">{appt.date}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">{appt.timeSlot}</span>
            </div>
          </div>
          {appt.notes && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
              {appt.notes}
            </p>
          )}
        </div>
        <span
          className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ml-2 flex-none ${getStatusBadgeClass(appt.status)}`}
        >
          {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
        </span>
      </div>
    </div>
  );

  const EmptyState = ({ label }: { label: string }) => (
    <div
      className="text-center py-16"
      data-ocid={`bookings.${label}.empty_state`}
    >
      <CalendarDays className="w-12 h-12 text-pink-200 mx-auto mb-3" />
      <h4 className="font-semibold text-foreground mb-1">
        No {label} bookings
      </h4>
      <p className="text-muted-foreground text-sm">
        {label === "upcoming"
          ? "Book a service to get started"
          : "Your completed appointments will appear here"}
      </p>
      {label === "upcoming" && (
        <Button
          className="mt-4 bg-primary text-white rounded-full px-5 shadow-pink"
          size="sm"
          onClick={() => onNavigate("services")}
        >
          Browse Services
        </Button>
      )}
    </div>
  );

  return (
    <div className="pb-24 animate-fade-in">
      <div className="gradient-hero px-5 pt-10 pb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              My Bookings
            </h1>
            <p className="text-white/70 text-xs mt-1">
              Track your appointments
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <NotificationBell appointments={appointments} />
            <Button
              data-ocid="bookings.book_button"
              size="sm"
              variant="outline"
              className="border-white/40 text-white bg-white/10 hover:bg-white/20 hover:text-white rounded-full text-xs h-8 px-3"
              onClick={() => onNavigate("services")}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Book Another
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <Tabs defaultValue="upcoming">
          <TabsList className="w-full bg-pink-100 rounded-2xl p-1 h-auto">
            <TabsTrigger
              data-ocid="bookings.upcoming_tab"
              value="upcoming"
              className="flex-1 rounded-xl text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-pink"
            >
              Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger
              data-ocid="bookings.past_tab"
              value="past"
              className="flex-1 rounded-xl text-sm data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-pink"
            >
              Past ({past.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {isLoading ? (
              <div data-ocid="bookings.loading_state" className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl shimmer" />
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <EmptyState label="upcoming" />
            ) : (
              upcoming.map((appt, i) => (
                <AppointmentCard
                  key={String(appt.id)}
                  appt={appt}
                  index={i + 1}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl shimmer" />
                ))}
              </div>
            ) : past.length === 0 ? (
              <EmptyState label="past" />
            ) : (
              past.map((appt, i) => (
                <AppointmentCard
                  key={String(appt.id)}
                  appt={appt}
                  index={i + 1}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROFILE SCREEN
// ─────────────────────────────────────────────────────────────
function ProfileScreen({
  profile,
  onNavigate,
  onLogout,
  isAdmin,
  appointments,
}: {
  profile: UserProfile | null;
  onNavigate: (s: Screen) => void;
  onLogout: () => void;
  isAdmin: boolean;
  appointments: Appointment[];
}) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: profile?.name ?? "",
    phone: profile?.phone ?? "",
  });
  const picInputRef = useRef<HTMLInputElement>(null);

  const principalId = identity?.getPrincipal().toString() ?? null;
  const truncatedPrincipal = principalId
    ? `${principalId.slice(0, 10)}...${principalId.slice(-6)}`
    : null;

  useEffect(() => {
    setForm({ name: profile?.name ?? "", phone: profile?.phone ?? "" });
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.saveCallerUserProfile(
        form.name,
        form.phone,
        profile?.email ?? "",
        profile?.profilePictureUrl ?? "",
      );
    },
    onSuccess: () => {
      toast.success("Profile updated!");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const picMutation = useMutation({
    mutationFn: async (dataUrl: string) => {
      if (!actor) throw new Error("Not connected");
      await actor.saveCallerUserProfile(
        profile?.name ?? "",
        profile?.phone ?? "",
        profile?.email ?? "",
        dataUrl,
      );
    },
    onSuccess: () => {
      toast.success("Profile picture updated!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      picMutation.mutate(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const initials = getInitials(profile?.name ?? "G");

  return (
    <div className="pb-24 animate-fade-in">
      {/* Header */}
      <div className="gradient-hero px-5 pt-10 pb-14">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-white">
            Profile
          </h1>
          <NotificationBell appointments={appointments} />
        </div>
      </div>

      {/* Avatar card */}
      <div className="px-4 -mt-8">
        <div className="bg-white rounded-3xl card-shadow-lg p-5 flex flex-col items-center gap-3">
          <div className="relative">
            {profile?.profilePictureUrl ? (
              <img
                src={profile.profilePictureUrl}
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover shadow-pink-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full gradient-pink flex items-center justify-center shadow-pink-lg">
                <span className="font-display font-bold text-white text-2xl">
                  {initials}
                </span>
              </div>
            )}
            {/* Camera overlay */}
            <button
              type="button"
              data-ocid="profile.upload_button"
              onClick={() => picInputRef.current?.click()}
              disabled={picMutation.isPending}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
              title="Change profile picture"
            >
              {picMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5 text-white" />
              )}
            </button>
            <input
              ref={picInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePicChange}
            />
          </div>
          <div className="text-center">
            <h2 className="font-display font-bold text-foreground text-xl">
              {profile?.name ?? "Guest"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {profile?.email ?? ""}
            </p>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 mt-1 bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <Shield className="w-3 h-3" />
                Admin
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 mt-5 space-y-3">
        {/* Info */}
        {editing ? (
          <div className="bg-white rounded-2xl p-4 card-shadow space-y-3">
            <h3 className="font-semibold text-foreground text-sm">
              Edit Profile
            </h3>
            <div>
              <label
                htmlFor="profile-name"
                className="text-xs font-medium text-muted-foreground block mb-1"
              >
                Name
              </label>
              <Input
                id="profile-name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className="rounded-xl border-pink-200 h-10"
              />
            </div>
            <div>
              <label
                htmlFor="profile-phone"
                className="text-xs font-medium text-muted-foreground block mb-1"
              >
                Phone
              </label>
              <Input
                id="profile-phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                className="rounded-xl border-pink-200 h-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                data-ocid="profile.save_button"
                className="flex-1 h-9 bg-primary text-white rounded-xl text-sm shadow-pink"
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-9 rounded-xl border-pink-200 text-sm"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 card-shadow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground text-sm">
                Personal Info
              </h3>
              <button
                type="button"
                data-ocid="profile.edit_button"
                onClick={() => setEditing(true)}
                className="text-primary text-xs font-semibold flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: "Name", value: profile?.name },
                { label: "Email", value: profile?.email },
                { label: "Phone", value: profile?.phone },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium text-foreground">
                    {value ?? "—"}
                  </span>
                </div>
              ))}
              {principalId && (
                <div className="flex items-center justify-between pt-1 border-t border-pink-100">
                  <span className="text-xs text-muted-foreground">
                    Principal ID
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      data-ocid="profile.principal_id"
                      className="text-xs font-mono text-foreground"
                    >
                      {truncatedPrincipal}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(principalId);
                        toast.success("Principal ID copied!");
                      }}
                      className="w-6 h-6 rounded-lg bg-pink-50 flex items-center justify-center hover:bg-pink-100 transition-colors"
                      title="Copy Principal ID"
                    >
                      <Copy className="w-3 h-3 text-primary" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin panel */}
        {isAdmin && (
          <button
            type="button"
            data-ocid="admin.open_modal_button"
            onClick={() => onNavigate("admin")}
            className="w-full bg-charcoal rounded-2xl p-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                <Shield className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Admin Panel</p>
                <p className="text-white/60 text-xs">
                  Manage services & bookings
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/50" />
          </button>
        )}

        {/* Logout */}
        <button
          type="button"
          data-ocid="profile.logout_button"
          onClick={onLogout}
          className="w-full bg-white rounded-2xl p-4 card-shadow flex items-center gap-3 text-destructive"
        >
          <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-4.5 h-4.5" />
          </div>
          <span className="font-semibold text-sm">Logout</span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 mt-8 pb-4 text-center">
        <p className="text-[11px] text-muted-foreground">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Built with ❤️ using caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ADMIN SCREEN
// ─────────────────────────────────────────────────────────────
function AdminScreen({ onBack }: { onBack: () => void }) {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      const todayDate = new Date().toISOString().split("T")[0];
      return actor.getAdminStats(todayDate);
    },
    enabled: !!actor && !isFetching,
  });

  const { data: services = [], isLoading: loadingServices } = useQuery<
    Service[]
  >({
    queryKey: ["services"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listServices();
    },
    enabled: !!actor && !isFetching,
  });

  const { data: allAppointments = [], isLoading: loadingAppointments } =
    useQuery<Appointment[]>({
      queryKey: ["all-appointments"],
      queryFn: async () => {
        if (!actor) return [];
        return actor.listAllAppointments();
      },
      enabled: !!actor && !isFetching,
    });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      await actor.deleteService(id);
    },
    onSuccess: () => {
      toast.success("Service deleted");
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: { id: bigint; status: AppointmentStatus }) => {
      if (!actor) throw new Error("No actor");
      await actor.updateAppointmentStatus(id, status);
    },
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["all-appointments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Users (admin)
  const { data: allUsers = [], isLoading: loadingUsers } = useQuery<
    UserProfile[]
  >({
    queryKey: ["all-users"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllUserProfiles();
    },
    enabled: !!actor && !isFetching,
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: { userId: string; role: UserRole__1 }) => {
      if (!actor) throw new Error("No actor");
      const { Principal } = await import("@icp-sdk/core/principal");
      await actor.assignCallerUserRole(Principal.fromText(userId), role);
    },
    onSuccess: () => {
      toast.success("Role updated!");
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Add service dialog
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    category: ServiceCategory.hair as string,
    price: "",
    durationMinutes: "",
    description: "",
    imageUrl: "",
  });
  const newServiceImgRef = useRef<HTMLInputElement>(null);

  // Edit service state
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editServiceForm, setEditServiceForm] = useState({
    name: "",
    category: ServiceCategory.hair as string,
    price: "",
    durationMinutes: "",
    description: "",
    imageUrl: "",
  });
  const editServiceImgRef = useRef<HTMLInputElement>(null);

  const editServiceMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !editingService) throw new Error("No actor");
      await actor.updateService(
        editingService.id,
        editServiceForm.name,
        editServiceForm.category as ServiceCategory,
        BigInt(Number(editServiceForm.price)),
        BigInt(Number(editServiceForm.durationMinutes)),
        editServiceForm.description,
        editServiceForm.imageUrl,
        true,
      );
    },
    onSuccess: () => {
      toast.success("Service updated!");
      setEditingService(null);
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Gallery state
  const { data: galleryPhotos = [], isLoading: loadingGallery } = useQuery<
    GalleryPhoto[]
  >({
    queryKey: ["gallery-photos"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listGalleryPhotos();
    },
    enabled: !!actor && !isFetching,
  });

  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [newPhoto, setNewPhoto] = useState({
    title: "",
    category: "hair",
    imageUrl: "",
  });

  // Edit gallery photo state
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);
  const [editPhotoForm, setEditPhotoForm] = useState({
    title: "",
    category: "hair",
    imageUrl: "",
  });

  const addPhotoMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.addGalleryPhoto(
        newPhoto.title,
        newPhoto.category,
        newPhoto.imageUrl,
        new Date().toISOString(),
      );
    },
    onSuccess: () => {
      toast.success("Photo added!");
      setShowAddPhoto(false);
      setNewPhoto({ title: "", category: "hair", imageUrl: "" });
      queryClient.invalidateQueries({ queryKey: ["gallery-photos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      await actor.deleteGalleryPhoto(id);
    },
    onSuccess: () => {
      toast.success("Photo deleted");
      queryClient.invalidateQueries({ queryKey: ["gallery-photos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const editPhotoMutation = useMutation({
    mutationFn: async () => {
      if (!actor || !editingPhoto) throw new Error("No actor");
      await actor.deleteGalleryPhoto(editingPhoto.id);
      await actor.addGalleryPhoto(
        editPhotoForm.title,
        editPhotoForm.category,
        editPhotoForm.imageUrl,
        new Date().toISOString(),
      );
    },
    onSuccess: () => {
      toast.success("Photo updated!");
      setEditingPhoto(null);
      queryClient.invalidateQueries({ queryKey: ["gallery-photos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addServiceMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.createService(
        newService.name,
        newService.category as ServiceCategory,
        BigInt(Number(newService.price)),
        BigInt(Number(newService.durationMinutes)),
        newService.description,
        newService.imageUrl,
        true,
      );
    },
    onSuccess: () => {
      toast.success("Service added!");
      setShowAddService(false);
      setNewService({
        name: "",
        category: ServiceCategory.hair,
        price: "",
        durationMinutes: "",
        description: "",
        imageUrl: "",
      });
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statCards = stats
    ? [
        {
          label: "Total Bookings",
          value: String(stats.totalBookings),
          icon: CalendarDays,
          color: "bg-pink-100 text-primary",
        },
        {
          label: "Revenue",
          value: formatPrice(stats.totalRevenue),
          icon: DollarSign,
          color: "bg-green-100 text-green-700",
        },
        {
          label: "Pending",
          value: String(stats.pendingCount),
          icon: Clock,
          color: "bg-yellow-100 text-yellow-700",
        },
        {
          label: "Confirmed",
          value: String(stats.confirmedCount),
          icon: CheckCircle2,
          color: "bg-blue-100 text-blue-700",
        },
        {
          label: "Today's Bookings",
          value: String(stats.todayBookingsCount),
          icon: CalendarDays,
          color: "bg-emerald-100 text-emerald-700",
        },
        {
          label: "Upcoming",
          value: String(stats.upcomingBookingsCount),
          icon: TrendingUp,
          color: "bg-purple-100 text-purple-700",
        },
      ]
    : [];

  return (
    <div className="min-h-dvh flex flex-col animate-fade-in">
      {/* Header */}
      <div className="gradient-hero px-5 pt-10 pb-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="text-white/80 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-white">
              Admin Panel
            </h1>
            <p className="text-white/70 text-xs">Manage Styloria</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-background rounded-t-3xl -mt-3 overflow-y-auto pb-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="w-full bg-pink-100 rounded-none p-1 h-auto sticky top-0 z-10">
            <TabsTrigger
              data-ocid="admin.dashboard_tab"
              value="dashboard"
              className="flex-1 text-[11px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-pink rounded-xl"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              data-ocid="admin.services_tab"
              value="services"
              className="flex-1 text-[11px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-pink rounded-xl"
            >
              Services
            </TabsTrigger>
            <TabsTrigger
              data-ocid="admin.bookings_tab"
              value="bookings"
              className="flex-1 text-[11px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-pink rounded-xl"
            >
              Bookings
            </TabsTrigger>
            <TabsTrigger
              data-ocid="admin.gallery_tab"
              value="gallery"
              className="flex-1 text-[11px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-pink rounded-xl"
            >
              Gallery
            </TabsTrigger>
            <TabsTrigger
              data-ocid="admin.users_tab"
              value="users"
              className="flex-1 text-[11px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-pink rounded-xl"
            >
              Users
            </TabsTrigger>
          </TabsList>

          {/* ── Dashboard ── */}
          <TabsContent value="dashboard" className="px-4 pt-5 space-y-4">
            <h3 className="font-display font-bold text-foreground">
              Analytics Overview
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {statCards.map(({ label, value, icon: Icon, color }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl p-4 card-shadow"
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-2`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <p className="font-display font-bold text-foreground text-xl">
                    {value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {stats && (
              <div className="bg-white rounded-2xl p-4 card-shadow">
                <h4 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-primary" /> Status
                  Breakdown
                </h4>
                <div className="space-y-2">
                  {[
                    {
                      label: "Completed",
                      count: stats.completedCount,
                      color: "bg-blue-400",
                    },
                    {
                      label: "Confirmed",
                      count: stats.confirmedCount,
                      color: "bg-green-400",
                    },
                    {
                      label: "Pending",
                      count: stats.pendingCount,
                      color: "bg-yellow-400",
                    },
                    {
                      label: "Cancelled",
                      count: stats.cancelledCount,
                      color: "bg-red-400",
                    },
                  ].map(({ label, count, color }) => {
                    const total = Number(stats.totalBookings) || 1;
                    const pct = Math.round((Number(count) / total) * 100);
                    return (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium">{String(count)}</span>
                        </div>
                        <div className="h-1.5 bg-pink-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${color} rounded-full`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Services ── */}
          <TabsContent value="services" className="px-4 pt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-foreground">
                Services
              </h3>
              <Button
                size="sm"
                className="h-8 text-xs bg-primary text-white rounded-full shadow-pink"
                onClick={() => setShowAddService(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Service
              </Button>
            </div>

            {loadingServices ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-2xl shimmer" />
                ))}
              </div>
            ) : services.length === 0 ? (
              <div
                className="text-center py-10"
                data-ocid="admin.services.empty_state"
              >
                <Scissors className="w-10 h-10 text-pink-200 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No services yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((svc, i) => (
                  <div
                    key={String(svc.id)}
                    data-ocid={`admin.service.item.${i + 1}`}
                    className="bg-white rounded-2xl p-4 card-shadow flex items-center gap-3"
                  >
                    {svc.imageUrl ? (
                      <img
                        src={svc.imageUrl}
                        alt={svc.name}
                        className="w-10 h-10 rounded-xl object-cover flex-none"
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-xl ${getCategoryGradient(svc.category)} flex items-center justify-center flex-none`}
                      >
                        <Scissors className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {svc.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(svc.price)} ·{" "}
                        {formatDuration(svc.durationMinutes)}
                      </p>
                    </div>
                    <button
                      type="button"
                      data-ocid={`admin.service.edit_button.${i + 1}`}
                      onClick={() => {
                        setEditingService(svc);
                        setEditServiceForm({
                          name: svc.name,
                          category: svc.category as string,
                          price: String(Number(svc.price)),
                          durationMinutes: String(Number(svc.durationMinutes)),
                          description: svc.description,
                          imageUrl: svc.imageUrl,
                        });
                      }}
                      className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center text-primary hover:bg-pink-200 flex-none mr-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      data-ocid={`admin.service.delete_button.${i + 1}`}
                      onClick={() => deleteServiceMutation.mutate(svc.id)}
                      className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 flex-none"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Edit Service Dialog */}
            <Dialog
              open={!!editingService}
              onOpenChange={(open) => {
                if (!open) setEditingService(null);
              }}
            >
              <DialogContent className="max-w-sm mx-auto rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="font-display">
                    Edit Service
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <div>
                    <label
                      htmlFor="edit-svc-name"
                      className="text-xs font-semibold block mb-1"
                    >
                      Service Name
                    </label>
                    <Input
                      id="edit-svc-name"
                      value={editServiceForm.name}
                      onChange={(e) =>
                        setEditServiceForm((p) => ({
                          ...p,
                          name: e.target.value,
                        }))
                      }
                      className="rounded-xl border-pink-200 h-10"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-svc-category"
                      className="text-xs font-semibold block mb-1"
                    >
                      Category
                    </label>
                    <select
                      id="edit-svc-category"
                      value={editServiceForm.category}
                      onChange={(e) =>
                        setEditServiceForm((p) => ({
                          ...p,
                          category: e.target.value,
                        }))
                      }
                      className="w-full h-10 px-3 rounded-xl border border-pink-200 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="hair">Hair</option>
                      <option value="makeup">Makeup</option>
                      <option value="skin">Skin</option>
                      <option value="nails">Nails</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="edit-svc-price"
                        className="text-xs font-semibold block mb-1"
                      >
                        Price (₹)
                      </label>
                      <Input
                        id="edit-svc-price"
                        type="number"
                        value={editServiceForm.price}
                        onChange={(e) =>
                          setEditServiceForm((p) => ({
                            ...p,
                            price: e.target.value,
                          }))
                        }
                        className="rounded-xl border-pink-200 h-10"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="edit-svc-duration"
                        className="text-xs font-semibold block mb-1"
                      >
                        Duration (min)
                      </label>
                      <Input
                        id="edit-svc-duration"
                        type="number"
                        value={editServiceForm.durationMinutes}
                        onChange={(e) =>
                          setEditServiceForm((p) => ({
                            ...p,
                            durationMinutes: e.target.value,
                          }))
                        }
                        className="rounded-xl border-pink-200 h-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="edit-svc-desc"
                      className="text-xs font-semibold block mb-1"
                    >
                      Description
                    </label>
                    <Textarea
                      id="edit-svc-desc"
                      value={editServiceForm.description}
                      onChange={(e) =>
                        setEditServiceForm((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      className="rounded-xl border-pink-200 resize-none"
                      rows={2}
                    />
                  </div>
                  {/* Image upload */}
                  <div>
                    <label
                      htmlFor="edit-svc-img"
                      className="text-xs font-semibold block mb-1"
                    >
                      Service Image
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        data-ocid="admin.service.upload_button"
                        size="sm"
                        variant="outline"
                        className="h-9 text-xs rounded-xl border-pink-200"
                        onClick={() => editServiceImgRef.current?.click()}
                      >
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                        Upload Image
                      </Button>
                      {editServiceForm.imageUrl && (
                        <img
                          src={editServiceForm.imageUrl}
                          alt="preview"
                          className="w-9 h-9 rounded-xl object-cover border border-pink-200"
                        />
                      )}
                    </div>
                    <input
                      id="edit-svc-img"
                      ref={editServiceImgRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () =>
                          setEditServiceForm((p) => ({
                            ...p,
                            imageUrl: reader.result as string,
                          }));
                        reader.readAsDataURL(file);
                      }}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    className="flex-1 h-10 bg-primary text-white rounded-xl shadow-pink text-sm"
                    onClick={() => editServiceMutation.mutate()}
                    disabled={
                      editServiceMutation.isPending ||
                      !editServiceForm.name ||
                      !editServiceForm.price
                    }
                  >
                    {editServiceMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-10 rounded-xl border-pink-200 text-sm"
                    onClick={() => setEditingService(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add Service Dialog */}
            <Dialog open={showAddService} onOpenChange={setShowAddService}>
              <DialogContent className="max-w-sm mx-auto rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="font-display">
                    Add New Service
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <div>
                    <label
                      htmlFor="svc-name"
                      className="text-xs font-semibold block mb-1"
                    >
                      Service Name
                    </label>
                    <Input
                      id="svc-name"
                      placeholder="e.g. Deep Conditioning"
                      value={newService.name}
                      onChange={(e) =>
                        setNewService((p) => ({ ...p, name: e.target.value }))
                      }
                      className="rounded-xl border-pink-200 h-10"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="svc-category"
                      className="text-xs font-semibold block mb-1"
                    >
                      Category
                    </label>
                    <select
                      id="svc-category"
                      value={newService.category}
                      onChange={(e) =>
                        setNewService((p) => ({
                          ...p,
                          category: e.target.value,
                        }))
                      }
                      className="w-full h-10 px-3 rounded-xl border border-pink-200 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="hair">Hair</option>
                      <option value="makeup">Makeup</option>
                      <option value="skin">Skin</option>
                      <option value="nails">Nails</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="svc-price"
                        className="text-xs font-semibold block mb-1"
                      >
                        Price (₹)
                      </label>
                      <Input
                        id="svc-price"
                        type="number"
                        placeholder="1500"
                        value={newService.price}
                        onChange={(e) =>
                          setNewService((p) => ({
                            ...p,
                            price: e.target.value,
                          }))
                        }
                        className="rounded-xl border-pink-200 h-10"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="svc-duration"
                        className="text-xs font-semibold block mb-1"
                      >
                        Duration (min)
                      </label>
                      <Input
                        id="svc-duration"
                        type="number"
                        placeholder="60"
                        value={newService.durationMinutes}
                        onChange={(e) =>
                          setNewService((p) => ({
                            ...p,
                            durationMinutes: e.target.value,
                          }))
                        }
                        className="rounded-xl border-pink-200 h-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="svc-desc"
                      className="text-xs font-semibold block mb-1"
                    >
                      Description
                    </label>
                    <Textarea
                      id="svc-desc"
                      placeholder="Service description…"
                      value={newService.description}
                      onChange={(e) =>
                        setNewService((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      className="rounded-xl border-pink-200 resize-none"
                      rows={2}
                    />
                  </div>
                  {/* Image upload */}
                  <div>
                    <label
                      htmlFor="new-svc-img"
                      className="text-xs font-semibold block mb-1"
                    >
                      Service Image
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        data-ocid="admin.new_service.upload_button"
                        size="sm"
                        variant="outline"
                        className="h-9 text-xs rounded-xl border-pink-200"
                        onClick={() => newServiceImgRef.current?.click()}
                      >
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                        Upload Image
                      </Button>
                      {newService.imageUrl && (
                        <img
                          src={newService.imageUrl}
                          alt="preview"
                          className="w-9 h-9 rounded-xl object-cover border border-pink-200"
                        />
                      )}
                    </div>
                    <input
                      id="new-svc-img"
                      ref={newServiceImgRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () =>
                          setNewService((p) => ({
                            ...p,
                            imageUrl: reader.result as string,
                          }));
                        reader.readAsDataURL(file);
                      }}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    className="flex-1 h-10 bg-primary text-white rounded-xl shadow-pink text-sm"
                    onClick={() => addServiceMutation.mutate()}
                    disabled={
                      addServiceMutation.isPending ||
                      !newService.name ||
                      !newService.price
                    }
                  >
                    {addServiceMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Add Service"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-10 rounded-xl border-pink-200 text-sm"
                    onClick={() => setShowAddService(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ── Bookings ── */}
          <TabsContent value="bookings" className="px-4 pt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-foreground">
                All Bookings
              </h3>
              <button
                type="button"
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["all-appointments"],
                  })
                }
                className="text-primary"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loadingAppointments ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl shimmer" />
                ))}
              </div>
            ) : allAppointments.length === 0 ? (
              <div
                className="text-center py-10"
                data-ocid="admin.bookings.empty_state"
              >
                <CalendarDays className="w-10 h-10 text-pink-200 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No bookings yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allAppointments.map((appt, i) => (
                  <div
                    key={String(appt.id)}
                    data-ocid={`admin.booking.item.${i + 1}`}
                    className="bg-white rounded-2xl p-4 card-shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">
                          Service #{String(appt.serviceId)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {appt.date} · {appt.timeSlot}
                        </p>
                      </div>
                      <select
                        value={appt.status}
                        onChange={(e) =>
                          updateStatusMutation.mutate({
                            id: appt.id,
                            status: e.target.value as AppointmentStatus,
                          })
                        }
                        className={`text-[10px] font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${getStatusBadgeClass(appt.status)}`}
                      >
                        {Object.values(AppointmentStatus).map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Gallery ── */}
          <TabsContent value="gallery" className="px-4 pt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-foreground">
                Gallery
              </h3>
              <Button
                size="sm"
                data-ocid="admin.gallery.add_button"
                className="h-8 text-xs bg-primary text-white rounded-full shadow-pink"
                onClick={() => setShowAddPhoto(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Photo
              </Button>
            </div>

            {loadingGallery ? (
              <div
                className="grid grid-cols-2 gap-3"
                data-ocid="admin.gallery.loading_state"
              >
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-36 rounded-2xl shimmer" />
                ))}
              </div>
            ) : galleryPhotos.length === 0 ? (
              <div
                className="text-center py-10"
                data-ocid="admin.gallery.empty_state"
              >
                <Camera className="w-10 h-10 text-pink-200 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No photos yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {galleryPhotos.map((photo, i) => (
                  <div
                    key={String(photo.id)}
                    data-ocid={`admin.gallery.item.${i + 1}`}
                    className="bg-white rounded-2xl card-shadow overflow-hidden relative"
                  >
                    {photo.imageUrl ? (
                      <img
                        src={photo.imageUrl}
                        alt={photo.title}
                        className="w-full h-28 object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-28 ${getCategoryGradient(photo.category)} flex items-center justify-center`}
                      >
                        <Camera className="w-8 h-8 text-white/60" />
                      </div>
                    )}
                    <div className="p-2.5">
                      <p className="font-semibold text-xs text-foreground line-clamp-1">
                        {photo.title}
                      </p>
                      <span className="text-[10px] text-primary font-medium">
                        {getCategoryLabel(photo.category)}
                      </span>
                    </div>
                    <button
                      type="button"
                      data-ocid={`admin.gallery.edit_button.${i + 1}`}
                      onClick={() => {
                        setEditingPhoto(photo);
                        setEditPhotoForm({
                          title: photo.title,
                          category: photo.category,
                          imageUrl: photo.imageUrl,
                        });
                      }}
                      className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-primary/80 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      data-ocid={`admin.gallery.delete_button.${i + 1}`}
                      onClick={() => deletePhotoMutation.mutate(photo.id)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-destructive/80 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Edit Photo Dialog */}
            <Dialog
              open={!!editingPhoto}
              onOpenChange={(open) => {
                if (!open) setEditingPhoto(null);
              }}
            >
              <DialogContent className="max-w-sm mx-auto rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="font-display">Edit Photo</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <div>
                    <label
                      htmlFor="ep-title"
                      className="text-xs font-semibold block mb-1"
                    >
                      Title
                    </label>
                    <Input
                      id="ep-title"
                      value={editPhotoForm.title}
                      onChange={(e) =>
                        setEditPhotoForm((p) => ({
                          ...p,
                          title: e.target.value,
                        }))
                      }
                      className="rounded-xl border-pink-200 h-10"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="ep-category"
                      className="text-xs font-semibold block mb-1"
                    >
                      Category
                    </label>
                    <select
                      id="ep-category"
                      value={editPhotoForm.category}
                      onChange={(e) =>
                        setEditPhotoForm((p) => ({
                          ...p,
                          category: e.target.value,
                        }))
                      }
                      className="w-full h-10 px-3 rounded-xl border border-pink-200 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="hair">Hair</option>
                      <option value="makeup">Makeup</option>
                      <option value="skin">Skin</option>
                      <option value="nails">Nails</option>
                      <option value="bridal">Bridal</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="ep-url"
                      className="text-xs font-semibold block mb-1"
                    >
                      Image URL
                    </label>
                    <Input
                      id="ep-url"
                      value={editPhotoForm.imageUrl}
                      onChange={(e) =>
                        setEditPhotoForm((p) => ({
                          ...p,
                          imageUrl: e.target.value,
                        }))
                      }
                      className="rounded-xl border-pink-200 h-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    className="flex-1 h-10 bg-primary text-white rounded-xl shadow-pink text-sm"
                    onClick={() => editPhotoMutation.mutate()}
                    disabled={
                      editPhotoMutation.isPending || !editPhotoForm.title
                    }
                  >
                    {editPhotoMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-10 rounded-xl border-pink-200 text-sm"
                    onClick={() => setEditingPhoto(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Add Photo Dialog */}
            <Dialog open={showAddPhoto} onOpenChange={setShowAddPhoto}>
              <DialogContent className="max-w-sm mx-auto rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="font-display">
                    Add Gallery Photo
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  <div>
                    <label
                      htmlFor="photo-title"
                      className="text-xs font-semibold block mb-1"
                    >
                      Title
                    </label>
                    <Input
                      id="photo-title"
                      placeholder="e.g. Bridal Hair Styling"
                      value={newPhoto.title}
                      onChange={(e) =>
                        setNewPhoto((p) => ({ ...p, title: e.target.value }))
                      }
                      className="rounded-xl border-pink-200 h-10"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="photo-category"
                      className="text-xs font-semibold block mb-1"
                    >
                      Category
                    </label>
                    <select
                      id="photo-category"
                      value={newPhoto.category}
                      onChange={(e) =>
                        setNewPhoto((p) => ({ ...p, category: e.target.value }))
                      }
                      className="w-full h-10 px-3 rounded-xl border border-pink-200 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="hair">Hair</option>
                      <option value="makeup">Makeup</option>
                      <option value="skin">Skin</option>
                      <option value="nails">Nails</option>
                      <option value="bridal">Bridal</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="photo-url"
                      className="text-xs font-semibold block mb-1"
                    >
                      Image URL
                    </label>
                    <Input
                      id="photo-url"
                      placeholder="https://example.com/photo.jpg"
                      value={newPhoto.imageUrl}
                      onChange={(e) =>
                        setNewPhoto((p) => ({ ...p, imageUrl: e.target.value }))
                      }
                      className="rounded-xl border-pink-200 h-10"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Paste a direct image URL
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    className="flex-1 h-10 bg-primary text-white rounded-xl shadow-pink text-sm"
                    onClick={() => addPhotoMutation.mutate()}
                    disabled={addPhotoMutation.isPending || !newPhoto.title}
                  >
                    {addPhotoMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Add Photo"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-10 rounded-xl border-pink-200 text-sm"
                    onClick={() => setShowAddPhoto(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ── Users ── */}
          <TabsContent value="users" className="px-4 pt-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-foreground">
                Registered Users
              </h3>
              <button
                type="button"
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ["all-users"] })
                }
                className="text-primary"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loadingUsers ? (
              <div className="space-y-3" data-ocid="admin.users.loading_state">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl shimmer" />
                ))}
              </div>
            ) : allUsers.length === 0 ? (
              <div
                className="text-center py-10"
                data-ocid="admin.users.empty_state"
              >
                <Users className="w-10 h-10 text-pink-200 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  No registered users yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {allUsers.map((u, i) => (
                  <div
                    key={String(u.id)}
                    data-ocid={`admin.user.item.${i + 1}`}
                    className="bg-white rounded-2xl p-4 card-shadow flex items-center gap-3"
                  >
                    {/* Avatar */}
                    {u.profilePictureUrl ? (
                      <img
                        src={u.profilePictureUrl}
                        alt={u.name}
                        className="w-10 h-10 rounded-full object-cover flex-none"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full gradient-pink flex items-center justify-center flex-none">
                        <span className="text-white text-xs font-bold">
                          {getInitials(u.name || "G")}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {u.name || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {u.email || u.phone || "No contact info"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-none">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          u.role === "admin"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {u.role}
                      </span>
                      {u.role === "admin" ? (
                        <button
                          type="button"
                          data-ocid={`admin.user.secondary_button.${i + 1}`}
                          onClick={() =>
                            assignRoleMutation.mutate({
                              userId: u.id.toString(),
                              role: UserRole__1.user,
                            })
                          }
                          disabled={assignRoleMutation.isPending}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        >
                          Remove Admin
                        </button>
                      ) : (
                        <button
                          type="button"
                          data-ocid={`admin.user.primary_button.${i + 1}`}
                          onClick={() =>
                            assignRoleMutation.mutate({
                              userId: u.id.toString(),
                              role: UserRole__1.admin,
                            })
                          }
                          disabled={assignRoleMutation.isPending}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                        >
                          Make Admin
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GALLERY SCREEN
// ─────────────────────────────────────────────────────────────
const GALLERY_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "hair", label: "Hair" },
  { id: "makeup", label: "Makeup" },
  { id: "skin", label: "Skin" },
  { id: "nails", label: "Nails" },
  { id: "bridal", label: "Bridal" },
  { id: "other", label: "Other" },
];

function GalleryScreen({
  isAdmin,
  onNavigate: _onNavigate,
  appointments,
}: {
  isAdmin: boolean;
  onNavigate: (s: Screen) => void;
  appointments: Appointment[];
}) {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("all");
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [newPhoto, setNewPhoto] = useState({
    title: "",
    category: "hair",
    imageUrl: "",
  });

  const { data: photos = [], isLoading } = useQuery<GalleryPhoto[]>({
    queryKey: ["gallery-photos"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listGalleryPhotos();
    },
    enabled: !!actor && !isFetching,
  });

  const addPhotoMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      await actor.addGalleryPhoto(
        newPhoto.title,
        newPhoto.category,
        newPhoto.imageUrl,
        new Date().toISOString(),
      );
    },
    onSuccess: () => {
      toast.success("Photo added to gallery!");
      setShowAddPhoto(false);
      setNewPhoto({ title: "", category: "hair", imageUrl: "" });
      queryClient.invalidateQueries({ queryKey: ["gallery-photos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      await actor.deleteGalleryPhoto(id);
    },
    onSuccess: () => {
      toast.success("Photo removed");
      queryClient.invalidateQueries({ queryKey: ["gallery-photos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered =
    activeCategory === "all"
      ? photos
      : photos.filter((p) => p.category === activeCategory);

  return (
    <div className="pb-24 animate-fade-in">
      {/* Header */}
      <div className="gradient-hero px-5 pt-10 pb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">
              Gallery
            </h1>
            <p className="text-white/70 text-xs mt-1">
              Client transformations &amp; styles
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <NotificationBell appointments={appointments} />
            {isAdmin && (
              <Button
                data-ocid="gallery.add_button"
                size="sm"
                variant="outline"
                className="border-white/40 text-white bg-white/10 hover:bg-white/20 hover:text-white rounded-full text-xs h-8 px-3"
                onClick={() => setShowAddPhoto(true)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Photo
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        {/* Category filter pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {GALLERY_CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-none px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat.id
                  ? "bg-primary text-white shadow-pink"
                  : "bg-pink-100 text-primary/70 hover:bg-pink-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Photos grid */}
        <div className="mt-4">
          {isLoading ? (
            <div
              data-ocid="gallery.loading_state"
              className="grid grid-cols-2 gap-3"
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-44 rounded-2xl shimmer" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div data-ocid="gallery.empty_state" className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl gradient-pink mx-auto mb-4 flex items-center justify-center opacity-40">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">
                No photos yet
              </h4>
              <p className="text-muted-foreground text-sm max-w-[200px] mx-auto">
                {activeCategory === "all"
                  ? "Gallery photos will appear here"
                  : `No ${getCategoryLabel(activeCategory)} photos yet`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 stagger-children">
              {filtered.map((photo, i) => (
                <div
                  key={String(photo.id)}
                  data-ocid={`gallery.photo.item.${i + 1}`}
                  className="bg-white rounded-2xl card-shadow overflow-hidden relative"
                >
                  {photo.imageUrl ? (
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      className="w-full h-36 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className={`w-full h-36 ${getCategoryGradient(photo.category)} flex items-center justify-center`}
                    >
                      <Camera className="w-8 h-8 text-white/50" />
                    </div>
                  )}
                  <div className="p-2.5">
                    <p className="font-semibold text-xs text-foreground line-clamp-1">
                      {photo.title}
                    </p>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block"
                      style={{
                        background: "oklch(0.95 0.03 355)",
                        color: "oklch(0.56 0.22 358)",
                      }}
                    >
                      {getCategoryLabel(photo.category)}
                    </span>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      data-ocid={`gallery.photo.delete_button.${i + 1}`}
                      onClick={() => deletePhotoMutation.mutate(photo.id)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-destructive/80 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Photo Dialog */}
      <Dialog open={showAddPhoto} onOpenChange={setShowAddPhoto}>
        <DialogContent className="max-w-sm mx-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              Add Gallery Photo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label
                htmlFor="g-title"
                className="text-xs font-semibold block mb-1"
              >
                Title
              </label>
              <Input
                id="g-title"
                placeholder="e.g. Bridal Updo"
                value={newPhoto.title}
                onChange={(e) =>
                  setNewPhoto((p) => ({ ...p, title: e.target.value }))
                }
                className="rounded-xl border-pink-200 h-10"
              />
            </div>
            <div>
              <label
                htmlFor="g-category"
                className="text-xs font-semibold block mb-1"
              >
                Category
              </label>
              <select
                id="g-category"
                value={newPhoto.category}
                onChange={(e) =>
                  setNewPhoto((p) => ({ ...p, category: e.target.value }))
                }
                className="w-full h-10 px-3 rounded-xl border border-pink-200 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="hair">Hair</option>
                <option value="makeup">Makeup</option>
                <option value="skin">Skin</option>
                <option value="nails">Nails</option>
                <option value="bridal">Bridal</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="g-url"
                className="text-xs font-semibold block mb-1"
              >
                Image URL
              </label>
              <Input
                id="g-url"
                placeholder="https://example.com/photo.jpg"
                value={newPhoto.imageUrl}
                onChange={(e) =>
                  setNewPhoto((p) => ({ ...p, imageUrl: e.target.value }))
                }
                className="rounded-xl border-pink-200 h-10"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Paste a direct image URL
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              className="flex-1 h-10 bg-primary text-white rounded-xl shadow-pink text-sm"
              onClick={() => addPhotoMutation.mutate()}
              disabled={addPhotoMutation.isPending || !newPhoto.title}
            >
              {addPhotoMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Add Photo"
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-10 rounded-xl border-pink-200 text-sm"
              onClick={() => setShowAddPhoto(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────
export default function App() {
  const { identity, clear, isInitializing } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  const [screen, setScreen] = useState<Screen>("login");
  const [prevScreen, setPrevScreen] = useState<Screen>("home");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [bookingSuccessId, setBookingSuccessId] = useState<string>("");
  const [booking, setBooking] = useState<BookingState>({
    service: null,
    date: "",
    timeSlot: "",
    notes: "",
    appointmentId: null,
    paymentId: null,
    amount: BigInt(0),
  });

  // Fetch profile once actor is ready
  const { data: profile, isLoading: profileLoading } =
    useQuery<UserProfile | null>({
      queryKey: ["profile"],
      queryFn: async () => {
        if (!actor) return null;
        return actor.getCallerUserProfile();
      },
      enabled: !!actor && !actorFetching && !!identity,
    });

  const { data: isAdmin = false } = useQuery<boolean>({
    queryKey: ["is-admin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });

  // Fetch appointments for notifications
  const { data: myAppointments = [] } = useQuery<Appointment[]>({
    queryKey: ["my-appointments"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listMyAppointments();
    },
    enabled: !!actor && !actorFetching && !!identity,
  });

  // Auth flow
  useEffect(() => {
    if (isInitializing || actorFetching) return;

    if (!identity) {
      // Not logged in
      if (!["login", "register", "admin-login", "admin"].includes(screen))
        setScreen("login");
      return;
    }

    if (profileLoading) return;

    if (profile === null || profile === undefined) {
      // Logged in but no profile
      setScreen("profile-setup");
      return;
    }

    // Has profile → go to main app
    if (["login", "register", "profile-setup"].includes(screen)) {
      setScreen("home");
    }
  }, [
    identity,
    isInitializing,
    profile,
    profileLoading,
    actorFetching,
    screen,
  ]);

  const navigate = useCallback(
    (s: Screen) => {
      setPrevScreen(screen);
      setScreen(s);
    },
    [screen],
  );

  const handleBookService = useCallback(
    (service: Service) => {
      setBooking((prev) => ({ ...prev, service, timeSlot: "", date: "" }));
      navigate("booking");
    },
    [navigate],
  );

  const handleServiceDetail = useCallback(
    (service: Service) => {
      setSelectedService(service);
      navigate("service-detail");
    },
    [navigate],
  );

  const handleLogout = useCallback(() => {
    clear();
    queryClient.clear();
    setScreen("login");
    setBooking({
      service: null,
      date: "",
      timeSlot: "",
      notes: "",
      appointmentId: null,
      paymentId: null,
      amount: BigInt(0),
    });
  }, [clear, queryClient]);

  const handlePaymentSuccess = useCallback(
    (_appointmentId: bigint, bookingId: string) => {
      setBookingSuccessId(bookingId);
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      navigate("payment-success");
    },
    [navigate, queryClient],
  );

  // Loading state
  if (isInitializing) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-16 h-16 rounded-2xl gradient-pink flex items-center justify-center shadow-pink animate-pulse">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div className="text-center">
          <p className="font-display text-2xl font-bold text-primary">
            Styloria
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Loading your experience…
          </p>
        </div>
        <Loader2 className="w-6 h-6 text-primary animate-spin mt-2" />
      </div>
    );
  }

  const mainScreens: Screen[] = [
    "home",
    "services",
    "bookings",
    "gallery",
    "profile",
  ];

  return (
    <div className="min-h-dvh bg-pink-50/40">
      <div className="mobile-container">
        <Toaster position="top-center" richColors />

        {/* ── Auth screens ── */}
        {screen === "login" && (
          <LoginScreen
            onGoRegister={() => navigate("register")}
            onGoAdmin={() => navigate("admin-login")}
          />
        )}

        {screen === "admin-login" && (
          <AdminLoginScreen
            onBack={() => navigate("login")}
            onSuccess={() => navigate("admin")}
          />
        )}

        {screen === "register" && (
          <RegisterScreen onBack={() => navigate("login")} />
        )}

        {screen === "profile-setup" && (
          <ProfileSetupScreen
            onComplete={() => {
              queryClient.invalidateQueries({ queryKey: ["profile"] });
              navigate("home");
            }}
          />
        )}

        {/* ── Main app screens ── */}
        {mainScreens.includes(screen) && (
          <>
            <main className="min-h-dvh">
              {screen === "home" && (
                <HomeScreen
                  profile={profile ?? null}
                  onNavigate={navigate}
                  onBookService={handleBookService}
                  onServiceDetail={handleServiceDetail}
                  appointments={myAppointments}
                />
              )}
              {screen === "services" && (
                <ServicesScreen
                  onBookService={handleBookService}
                  onServiceDetail={handleServiceDetail}
                  appointments={myAppointments}
                />
              )}
              {screen === "bookings" && (
                <BookingsScreen
                  onNavigate={navigate}
                  appointments={myAppointments}
                />
              )}
              {screen === "gallery" && (
                <GalleryScreen
                  isAdmin={isAdmin}
                  onNavigate={navigate}
                  appointments={myAppointments}
                />
              )}
              {screen === "profile" && (
                <ProfileScreen
                  profile={profile ?? null}
                  onNavigate={navigate}
                  onLogout={handleLogout}
                  isAdmin={isAdmin}
                  appointments={myAppointments}
                />
              )}
            </main>
            <BottomNav current={screen} onNavigate={navigate} />
          </>
        )}

        {/* ── Sub-screens ── */}
        {screen === "service-detail" && selectedService && (
          <ServiceDetailScreen
            service={selectedService}
            onBack={() => navigate(prevScreen)}
            onBook={handleBookService}
          />
        )}

        {screen === "booking" && (
          <BookingScreen
            booking={booking}
            onUpdateBooking={(updates) =>
              setBooking((prev) => ({ ...prev, ...updates }))
            }
            onBack={() => navigate(prevScreen)}
            onProceedToPayment={() => navigate("payment")}
          />
        )}

        {screen === "payment" && (
          <PaymentScreen
            booking={booking}
            onBack={() => navigate("booking")}
            onSuccess={handlePaymentSuccess}
            profile={profile ?? null}
          />
        )}

        {screen === "payment-success" && (
          <PaymentSuccessScreen
            bookingId={bookingSuccessId}
            onViewBookings={() => navigate("bookings")}
            onHome={() => navigate("home")}
          />
        )}

        {screen === "admin" && (
          <AdminScreen
            onBack={() => navigate(identity ? "profile" : "admin-login")}
          />
        )}

        {/* No profile loading overlay */}
        {identity && profileLoading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl gradient-pink flex items-center justify-center shadow-pink">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <p className="text-foreground font-medium text-sm">
                Loading your profile…
              </p>
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
