"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useGetServiceByIdQuery,
  useGetServiceAvailabilityQuery,
  useCreateBookingMutation,
  useGetMeQuery,
} from "../../../store/apis";
import { Service, AvailabilitySlot } from "@repo/types";
import { toast } from "../../../components/Toast";
import {
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  X,
} from "../../../components/Icons";

interface PageProps {
  params: Promise<{ id: string }>;
}

const getTomorrowDateString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
};

const getTodayDateString = () => {
  return new Date().toISOString().slice(0, 10);
};

const formatTime12 = (time24?: string) => {
  if (!time24) return "—";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr || "0", 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mStr} ${ampm}`;
};

// ==========================================
// COLOCATED DATE PICKER COMPONENT
// ==========================================
function DatePicker({
  selectedDate,
  onSelectDate,
  minDate = getTodayDateString(),
}: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  minDate?: string;
}) {
  const [viewDate, setViewDate] = useState(() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handlePrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  const days = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "1.25rem",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CalendarIcon size={18} style={{ color: "#2563eb" }} />
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>
            {monthNames[month]} {year}
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.25rem" }}>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="btn btn-secondary btn-sm"
            style={{ padding: "0.3rem 0.5rem" }}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="btn btn-secondary btn-sm"
            style={{ padding: "0.3rem 0.5rem" }}
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          textAlign: "center",
          marginBottom: "0.5rem",
        }}
      >
        {daysOfWeek.map((day, idx) => (
          <div
            key={idx}
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#64748b",
              padding: "0.25rem 0",
            }}
          >
            {day}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "4px",
        }}
      >
        {days.map((dateStr, idx) => {
          if (!dateStr) {
            return <div key={`empty-${idx}`} style={{ height: "38px" }} />;
          }

          const dayNumber = parseInt(dateStr.slice(8, 10), 10);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const isPast = minDate ? dateStr < minDate : false;

          let bg = "transparent";
          let color = "#0f172a";
          let border = "1px solid transparent";
          let fontWeight = 500;

          if (isPast) {
            color = "#cbd5e1";
          } else if (isSelected) {
            bg = "#2563eb";
            color = "#ffffff";
            fontWeight = 700;
          } else if (isToday) {
            border = "1px solid #2563eb";
            fontWeight = 700;
          }

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isPast}
              onClick={() => onSelectDate(dateStr)}
              style={{
                height: "38px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                border,
                backgroundColor: bg,
                color,
                fontSize: "0.88rem",
                fontWeight,
                cursor: isPast ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
              className={!isPast && !isSelected ? "calendar-day-hover" : ""}
              aria-label={dateStr}
              aria-pressed={isSelected}
            >
              {dayNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================
// COLOCATED TIME SLOT PICKER COMPONENT
// ==========================================
function TimeSlotPicker({
  slots,
  selectedSlot,
  onSelectSlot,
  isLoading = false,
  duration,
}: {
  slots: AvailabilitySlot[];
  selectedSlot: AvailabilitySlot | null;
  onSelectSlot: (slot: AvailabilitySlot) => void;
  isLoading?: boolean;
  duration?: number;
}) {
  if (isLoading) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: "0.65rem",
        }}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: "60px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
          />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div
        style={{
          padding: "1.5rem",
          textAlign: "center",
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          border: "1px dashed #cbd5e1",
          color: "#64748b",
          fontSize: "0.9rem",
        }}
      >
        No available time slots for this date. Please select another day.
      </div>
    );
  }

  const morningSlots: AvailabilitySlot[] = [];
  const afternoonSlots: AvailabilitySlot[] = [];
  const eveningSlots: AvailabilitySlot[] = [];

  slots.forEach((slot) => {
    const hour = parseInt(slot.startTime.split(":")[0] || "0", 10);
    if (hour < 12) {
      morningSlots.push(slot);
    } else if (hour < 17) {
      afternoonSlots.push(slot);
    } else {
      eveningSlots.push(slot);
    }
  });

  const renderSlotGroup = (title: string, groupSlots: AvailabilitySlot[]) => {
    if (groupSlots.length === 0) return null;

    return (
      <div style={{ marginBottom: "1.25rem" }}>
        <div
          style={{
            fontSize: "0.78rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "#64748b",
            marginBottom: "0.6rem",
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: "0.65rem",
          }}
        >
          {groupSlots.map((slot) => {
            const isAvailable = slot.isAvailable ?? slot.available ?? false;
            const isSelected = selectedSlot?.startTime === slot.startTime;

            return (
              <button
                key={slot.startTime}
                type="button"
                disabled={!isAvailable}
                onClick={() => isAvailable && onSelectSlot(slot)}
                id={`slot-${slot.startTime.replace(":", "")}`}
                style={{
                  padding: "0.65rem 0.5rem",
                  borderRadius: "8px",
                  border: isSelected
                    ? "2px solid #2563eb"
                    : isAvailable
                      ? "1px solid #e2e8f0"
                      : "1px solid #f1f5f9",
                  backgroundColor: isSelected
                    ? "#eff6ff"
                    : isAvailable
                      ? "#ffffff"
                      : "#f8fafc",
                  color: isSelected
                    ? "#1d4ed8"
                    : isAvailable
                      ? "#0f172a"
                      : "#94a3b8",
                  cursor: isAvailable ? "pointer" : "not-allowed",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.2rem",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 0 0 1px #2563eb" : "none",
                }}
                className={isAvailable && !isSelected ? "timeslot-hover" : ""}
                aria-pressed={isSelected}
                aria-disabled={!isAvailable}
              >
                <span style={{ fontWeight: isSelected ? 700 : 600, fontSize: "0.92rem" }}>
                  {formatTime12(slot.startTime)}
                </span>
                {duration && (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: isSelected ? "#2563eb" : "#64748b",
                    }}
                  >
                    {duration} min
                  </span>
                )}
                {!isAvailable && (
                  <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                    Unavailable
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderSlotGroup("Morning", morningSlots)}
      {renderSlotGroup("Afternoon", afternoonSlots)}
      {renderSlotGroup("Evening", eveningSlots)}
    </div>
  );
}

// ==========================================
// COLOCATED BOOKING SUMMARY WIDGET
// ==========================================
function BookingSummaryWidget({
  service,
  selectedDate,
  selectedSlot,
  onProceed,
  isLoading = false,
  disabled = false,
}: {
  service: Service;
  selectedDate: string;
  selectedSlot: AvailabilitySlot | null;
  onProceed: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Select a date";
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y!, m! - 1, d!);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div
      style={{
        position: "sticky",
        top: "5.5rem",
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "1.5rem",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
      }}
    >
      <h3
        style={{
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: "1.25rem",
          paddingBottom: "0.75rem",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        Booking Summary
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <span style={{ fontSize: "0.78rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
            Selected Service
          </span>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", marginTop: "0.2rem" }}>
            {service.name}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#f8fafc",
            borderRadius: "8px",
            padding: "0.85rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.88rem", color: "#334155" }}>
            <CalendarIcon size={16} style={{ color: "#2563eb", flexShrink: 0 }} />
            <span>{formatDate(selectedDate)}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.88rem", color: "#334155" }}>
            <Clock size={16} style={{ color: "#2563eb", flexShrink: 0 }} />
            <span>
              {selectedSlot ? `${formatTime12(selectedSlot.startTime)} – ${formatTime12(selectedSlot.endTime)}` : "Select an available slot"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem" }}>
          <span style={{ color: "#64748b" }}>Duration</span>
          <span style={{ fontWeight: 600, color: "#0f172a" }}>{service.duration} minutes</span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "0.85rem",
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "#0f172a" }}>Total Rate</span>
          <span style={{ fontSize: "1.45rem", fontWeight: 800, color: "#0f172a" }}>
            ₹{Number(service.price).toFixed(0)}
          </span>
        </div>
      </div>

      <button
        type="button"
        disabled={disabled || !selectedSlot || isLoading}
        onClick={onProceed}
        className="btn btn-primary"
        style={{
          width: "100%",
          padding: "0.85rem 1.25rem",
          fontSize: "0.95rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
        }}
      >
        <span>{isLoading ? "Processing..." : selectedSlot ? "Review & Confirm Booking" : "Select Date & Time"}</span>
        {!isLoading && <ArrowRight size={16} />}
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.4rem",
          marginTop: "1rem",
          fontSize: "0.78rem",
          color: "#64748b",
        }}
      >
        <Shield size={14} style={{ color: "#059669" }} />
        <span>No double-booking guarantee • Authoritative price</span>
      </div>
    </div>
  );
}

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
export default function ServiceDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const serviceId = resolvedParams.id;

  // 1. Fetch Service Details
  const {
    data: serviceData,
    isLoading: isServiceLoading,
    isError: isServiceError,
    refetch: refetchService,
  } = useGetServiceByIdQuery(serviceId);
  const service = serviceData?.data;

  // 2. Auth State
  const { data: userData } = useGetMeQuery();
  const currentUser = userData?.data;
  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role === "ADMIN";

  // 3. Booking State
  const [selectedDate, setSelectedDate] = useState<string>(getTomorrowDateString());
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // 4. Availability Query
  const {
    data: availabilityData,
    isLoading: isAvailabilityLoading,
    refetch: refetchAvailability,
  } = useGetServiceAvailabilityQuery(
    { serviceId, date: selectedDate },
    { skip: !serviceId || !selectedDate }
  );
  const slots = availabilityData?.data?.slots || [];

  // 5. Create Booking Mutation
  const [createBooking, { isLoading: isBookingSubmitting }] = useCreateBookingMutation();

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setSelectedSlot(null);
    setConflictError(null);
  };

  const handleSlotSelect = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot);
    setConflictError(null);
  };

  const handleOpenConfirmDialog = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/services/${serviceId}`);
      return;
    }
    if (!selectedSlot) return;
    setIsConfirmModalOpen(true);
  };

  const handleExecuteBooking = async () => {
    if (!selectedSlot || isBookingSubmitting) return;
    setConflictError(null);

    try {
      const res = await createBooking({
        serviceId,
        bookingDate: selectedDate,
        startTime: selectedSlot.startTime,
      }).unwrap();

      if (res.success && res.data) {
        setIsConfirmModalOpen(false);
        toast.success("Booking confirmed successfully!");
        router.push(`/bookings/${res.data.id}`);
      }
    } catch (err: any) {
      setIsConfirmModalOpen(false);
      if (err?.status === 409) {
        setConflictError("This time slot is no longer available. Please select another slot.");
        setSelectedSlot(null);
        refetchAvailability();
        toast.error("Selected slot is no longer available.");
      } else if (err?.status === 401) {
        toast.error("Please log in to confirm your booking.");
        router.push(`/login?redirect=/services/${serviceId}`);
      } else if (err?.status === 403) {
        setConflictError("You do not have permission to place this booking. Please ensure you are logged in.");
      } else {
        const msg = err?.data?.message || "Unable to create booking. Please try again.";
        setConflictError(msg);
        toast.error(msg);
      }
    }
  };

  // Keyboard Escape listener for confirmation dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isConfirmModalOpen) {
        setIsConfirmModalOpen(false);
      }
    };
    if (isConfirmModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConfirmModalOpen]);

  return (
    <div className="container">
      {/* Breadcrumbs */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.85rem",
          color: "#64748b",
          marginBottom: "1.75rem",
        }}
        aria-label="Breadcrumb"
      >
        <Link href="/" style={{ color: "#64748b", textDecoration: "none" }} className="nav-link-hover">
          Home
        </Link>
        <ChevronRight size={14} />
        <Link href="/services" style={{ color: "#64748b", textDecoration: "none" }} className="nav-link-hover">
          Services
        </Link>
        <ChevronRight size={14} />
        <span style={{ color: "#0f172a", fontWeight: 600, maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {service?.name || "Service Details"}
        </span>
      </nav>

      {/* Loading Skeleton (Matching Reference) */}
      {isServiceLoading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
          <div className="skeleton-card" style={{ padding: "1.5rem" }}>
            <div className="skeleton-thumb" style={{ height: "240px" }} />
            <div className="skeleton-meta-row" style={{ marginTop: "1rem" }}>
              <div className="skeleton-circle" style={{ width: "44px", height: "44px" }} />
              <div className="skeleton-lines">
                <div className="skeleton-line-title" style={{ height: "18px", width: "85%" }} />
                <div className="skeleton-line-subtitle" style={{ height: "14px", width: "50%" }} />
              </div>
            </div>
            <div className="skeleton-lines" style={{ marginTop: "1rem" }}>
              <div className="skeleton-line-title" style={{ height: "12px", width: "100%" }} />
              <div className="skeleton-line-title" style={{ height: "12px", width: "95%" }} />
              <div className="skeleton-line-title" style={{ height: "12px", width: "60%" }} />
            </div>
          </div>
          <div className="skeleton-card" style={{ padding: "1.5rem", height: "fit-content" }}>
            <div className="skeleton-thumb" style={{ height: "160px" }} />
            <div className="skeleton-lines" style={{ marginTop: "1rem" }}>
              <div className="skeleton-line-title" style={{ height: "14px", width: "70%" }} />
              <div className="skeleton-line-subtitle" style={{ height: "12px", width: "40%" }} />
            </div>
          </div>
        </div>
      )}

      {/* Error / 404 State */}
      {isServiceError && !isServiceLoading && (
        <div
          style={{
            padding: "3.5rem 1.5rem",
            textAlign: "center",
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #fee2e2",
            maxWidth: "520px",
            margin: "2rem auto",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "#fef2f2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}
          >
            <AlertTriangle size={26} />
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
            Service Not Found
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: "1.75rem" }}>
            The requested service could not be found or has been deactivated.
          </p>
          <button onClick={() => refetchService()} className="btn btn-primary btn-sm">
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Main Service Content */}
      {!isServiceLoading && !isServiceError && service && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 380px",
            gap: "2.5rem",
            alignItems: "start",
          }}
          className="service-details-grid"
        >
          {/* LEFT: Service Info & Booking Step Selectors */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            {/* Header & Overview Card */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "2rem",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
              }}
            >
              {/* Service Hero Image Banner */}
              <div
                style={{
                  width: "100%",
                  height: "220px",
                  borderRadius: "10px",
                  overflow: "hidden",
                  marginBottom: "1.5rem",
                  backgroundColor: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                }}
              >
                <img
                  src={service.image || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"}
                  alt={service.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80";
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "0.2rem 0.55rem",
                        borderRadius: "9999px",
                        backgroundColor: service.isActive ? "#ecfdf5" : "#f1f5f9",
                        color: service.isActive ? "#059669" : "#64748b",
                        border: service.isActive ? "1px solid #a7f3d0" : "1px solid #e2e8f0",
                      }}
                    >
                      {service.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>
                      ID: {service.id.slice(0, 8)}...
                    </span>
                  </div>
                  <h1
                    style={{
                      fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                      fontWeight: 800,
                      color: "#0f172a",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.2,
                    }}
                  >
                    {service.name}
                  </h1>
                </div>

                <div
                  style={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "0.6rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Clock size={16} style={{ color: "#2563eb" }} />
                  <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
                    {service.duration} mins
                  </span>
                </div>
              </div>

              <p style={{ color: "#475569", fontSize: "1rem", lineHeight: 1.65, marginTop: "0.5rem" }}>
                {service.description || "Certified service provided by verified professionals with guaranteed satisfaction."}
              </p>

              {/* Inclusions */}
              <div
                style={{
                  marginTop: "1.75rem",
                  paddingTop: "1.5rem",
                  borderTop: "1px solid #f1f5f9",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.88rem", color: "#334155" }}>
                  <CheckCircle size={16} style={{ color: "#059669" }} />
                  <span>Verified Service Specialist</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.88rem", color: "#334155" }}>
                  <CheckCircle size={16} style={{ color: "#059669" }} />
                  <span>Tools & Materials Included</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.88rem", color: "#334155" }}>
                  <CheckCircle size={16} style={{ color: "#059669" }} />
                  <span>Guaranteed Punctual Arrival</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.88rem", color: "#334155" }}>
                  <Shield size={16} style={{ color: "#2563eb" }} />
                  <span>ACID Collision-Free Guarantee</span>
                </div>
              </div>
            </div>

            {/* 409 Conflict Banner */}
            {conflictError && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  padding: "1rem 1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  color: "#991b1b",
                  fontSize: "0.92rem",
                }}
                role="alert"
              >
                <AlertTriangle size={20} style={{ color: "#dc2626", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>{conflictError}</div>
              </div>
            )}

            {/* Scheduling Section */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "2rem",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  marginBottom: "1.5rem",
                }}
              >
                Schedule Your Appointment
              </h2>

              {/* Step 1: Date Selection */}
              <div style={{ marginBottom: "2rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: "0.75rem",
                  }}
                >
                  1. Select Appointment Date
                </label>
                <DatePicker
                  selectedDate={selectedDate}
                  onSelectDate={handleDateChange}
                  minDate={getTodayDateString()}
                />
              </div>

              {/* Step 2: Time Slot Selection */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.75rem",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    2. Select Available Time Slot ({service.duration} mins)
                  </label>
                  {isAvailabilityLoading && (
                    <span style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: 500 }}>
                      Checking live slots...
                    </span>
                  )}
                </div>

                <TimeSlotPicker
                  slots={slots}
                  selectedSlot={selectedSlot}
                  onSelectSlot={handleSlotSelect}
                  isLoading={isAvailabilityLoading}
                  duration={service.duration}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Sticky Booking Summary */}
          <div>
            <BookingSummaryWidget
              service={service}
              selectedDate={selectedDate}
              selectedSlot={selectedSlot}
              onProceed={handleOpenConfirmDialog}
              isLoading={isBookingSubmitting}
              disabled={!selectedSlot || isBookingSubmitting}
            />
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmModalOpen && service && selectedSlot && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setIsConfirmModalOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
            }}
          />

          {/* Dialog Window */}
          <div
            style={{
              position: "relative",
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              width: "100%",
              maxWidth: "480px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.75rem",
              zIndex: 1001,
            }}
            role="dialog"
            aria-modal="true"
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
                paddingBottom: "0.75rem",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Confirm Your Appointment
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem", margin: 0 }}>
                  Review your appointment details before locking in the booking.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "0.25rem",
                  display: "flex",
                }}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "1rem 1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  fontSize: "0.92rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Service</span>
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>{service.name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Date</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>{selectedDate}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Time Window</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>
                    {formatTime12(selectedSlot.startTime)} – {formatTime12(selectedSlot.endTime)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Duration</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>{service.duration} minutes</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "0.75rem",
                    borderTop: "1px solid #e2e8f0",
                    fontSize: "1.05rem",
                  }}
                >
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>Total Amount</span>
                  <span style={{ fontWeight: 800, color: "#0f172a" }}>
                    ₹{Number(service.price).toFixed(0)}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
                By confirming, this slot will be securely reserved for you. Backend collision detection ensures guaranteed availability.
              </p>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  disabled={isBookingSubmitting}
                  className="btn btn-secondary btn-md"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBooking}
                  disabled={isBookingSubmitting}
                  className="btn btn-primary btn-md"
                  style={{ minWidth: "160px" }}
                >
                  {isBookingSubmitting ? "Confirming..." : "Confirm Booking"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media (max-width: 900px) {
          .service-details-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
