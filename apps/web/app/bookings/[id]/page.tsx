"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useGetBookingByIdQuery,
  useCancelBookingMutation,
} from "../../../store/apis";
import { BookingStatus } from "@repo/types";
import { toast } from "../../../components/Toast";
import {
  ChevronRight,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  X,
} from "../../../components/Icons";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Colocated Status Badge
function StatusBadge({ status }: { status: BookingStatus | string }) {
  const normalized = status.toUpperCase();

  let bg = "#f1f5f9";
  let color = "#475569";
  let border = "1px solid #e2e8f0";
  let dotColor = "#94a3b8";

  if (normalized === "PENDING") {
    bg = "#fef3c7";
    color = "#92400e";
    border = "1px solid #fde68a";
    dotColor = "#d97706";
  } else if (normalized === "CONFIRMED") {
    bg = "#eff6ff";
    color = "#1e40af";
    border = "1px solid #bfdbfe";
    dotColor = "#2563eb";
  } else if (normalized === "COMPLETED") {
    bg = "#ecfdf5";
    color = "#065f46";
    border = "1px solid #a7f3d0";
    dotColor = "#059669";
  } else if (normalized === "CANCELLED") {
    bg = "#fef2f2";
    color = "#991b1b";
    border = "1px solid #fecaca";
    dotColor = "#dc2626";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.25rem 0.65rem",
        borderRadius: "9999px",
        fontSize: "0.78rem",
        fontWeight: 700,
        backgroundColor: bg,
        color,
        border,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: dotColor,
        }}
      />
      <span>{normalized}</span>
    </span>
  );
}

export default function BookingDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const bookingId = resolvedParams.id;

  const { data, isLoading, isError, refetch } = useGetBookingByIdQuery(bookingId, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 3000,
  });
  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation();

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const booking = data?.data;

  const handleCancel = async () => {
    try {
      const res = await cancelBooking(bookingId).unwrap();
      if (res.success) {
        toast.success("Booking cancelled successfully.");
        setIsCancelModalOpen(false);
        refetch();
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to cancel booking.");
    }
  };

  const formatTime12 = (time24?: string) => {
    if (!time24) return "—";
    const [hStr, mStr] = time24.split(":");
    let h = parseInt(hStr || "0", 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${mStr} ${ampm}`;
  };

  const canCancel = booking?.status === "PENDING" || booking?.status === "CONFIRMED";

  const isCancelled = booking?.status === "CANCELLED";
  const isConfirmed = booking?.status === "CONFIRMED" || booking?.status === "COMPLETED";
  const isCompleted = booking?.status === "COMPLETED";

  // Escape key listener for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCancelModalOpen) {
        setIsCancelModalOpen(false);
      }
    };
    if (isCancelModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCancelModalOpen]);

  return (
    <div className="container" style={{ maxWidth: "860px" }}>
      {/* Breadcrumb */}
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
        <Link href="/bookings" style={{ color: "#64748b", textDecoration: "none" }} className="nav-link-hover">
          My Bookings
        </Link>
        <ChevronRight size={14} />
        <span style={{ color: "#0f172a", fontWeight: 600 }}>
          Booking Details
        </span>
      </nav>

      {/* Loading Skeleton */}
      {isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="skeleton" style={{ height: "180px", borderRadius: "14px", width: "100%" }} />
          <div className="skeleton" style={{ height: "140px", borderRadius: "14px", width: "100%" }} />
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <div
          style={{
            padding: "3.5rem 1.5rem",
            textAlign: "center",
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #fee2e2",
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
            Booking Not Found
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: "1.75rem" }}>
            The requested appointment details could not be retrieved or you do not have permission to view them.
          </p>
          <button onClick={() => refetch()} className="btn btn-primary btn-sm">
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !isError && booking && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Header Card */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "2rem",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
                  <StatusBadge status={booking.status} />
                  <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                    Created on {new Date(booking.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h1
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: "-0.02em",
                    margin: 0,
                  }}
                >
                  {booking.service?.name || "Service Appointment"}
                </h1>
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.3rem" }}>
                  Reference ID: <code style={{ backgroundColor: "#f1f5f9", padding: "0.15rem 0.45rem", borderRadius: "4px" }}>{booking.id}</code>
                </div>
              </div>

              {canCancel && (
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ color: "#dc2626", borderColor: "#fecaca" }}
                >
                  Cancel Booking
                </button>
              )}
            </div>

            {/* 4-Step Visual Timeline */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: "10px",
                padding: "1.5rem",
                border: "1px solid #e2e8f0",
                marginTop: "1.5rem",
              }}
            >
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.25rem" }}>
                Appointment Status Timeline
              </div>

              {isCancelled ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#b91c1c", backgroundColor: "#fef2f2", padding: "0.85rem 1rem", borderRadius: "8px", border: "1px solid #fecaca" }}>
                  <XCircle size={20} />
                  <div>
                    <strong style={{ fontSize: "0.95rem" }}>This appointment has been cancelled</strong>
                    <div style={{ fontSize: "0.82rem", color: "#991b1b" }}>The scheduled time slot was released back to the availability pool.</div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))",
                    gap: "1.25rem",
                    position: "relative",
                  }}
                >
                  {/* Step 1: Pending */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#d97706", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700 }}>✓</span>
                      <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>Pending</span>
                    </div>
                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Order registered</span>
                  </div>

                  {/* Step 2: Confirmed */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: isConfirmed ? "#2563eb" : "#e2e8f0", color: isConfirmed ? "#ffffff" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700 }}>
                        {isConfirmed ? "✓" : "2"}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: "0.88rem", color: isConfirmed ? "#0f172a" : "#94a3b8" }}>Confirmed</span>
                    </div>
                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      {isConfirmed ? "Slot confirmed" : "Awaiting review"}
                    </span>
                  </div>

                  {/* Step 3: Completed */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: isCompleted ? "#059669" : "#e2e8f0", color: isCompleted ? "#ffffff" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700 }}>
                        {isCompleted ? "★" : "3"}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: "0.88rem", color: isCompleted ? "#0f172a" : "#94a3b8" }}>Completed</span>
                    </div>
                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      {isCompleted ? "Service finalized" : "Pending service"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details Grid: 2 Columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: "1.5rem",
            }}
          >
            {/* Schedule & Timing */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "1.75rem",
              }}
            >
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", marginBottom: "1.25rem" }}>
                Appointment Schedule
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.92rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Date</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>{booking.bookingDate}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Time Window</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>
                    {formatTime12(booking.startTime)} – {formatTime12(booking.endTime)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Duration</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>
                    {booking.service?.duration || 60} minutes
                  </span>
                </div>
              </div>
            </div>

            {/* Billing & Rate */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "14px",
                padding: "1.75rem",
              }}
            >
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", marginBottom: "1.25rem" }}>
                Authoritative Rate
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.92rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Base Service Fee</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>₹{Number(booking.amount).toFixed(0)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Platform Collision Engine</span>
                  <span style={{ fontWeight: 600, color: "#059669" }}>Included (₹0)</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "0.85rem",
                    borderTop: "1px solid #f1f5f9",
                    fontSize: "1.1rem",
                  }}
                >
                  <span style={{ fontWeight: 700, color: "#0f172a" }}>Total</span>
                  <span style={{ fontWeight: 800, color: "#0f172a" }}>
                    ₹{Number(booking.amount).toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link href="/bookings" className="btn btn-secondary btn-md">
              <ArrowLeft size={16} />
              <span>Back to My Bookings</span>
            </Link>
            <Link href="/services" className="btn btn-primary btn-md">
              Book Another Service
            </Link>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {isCancelModalOpen && booking && (
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
          <div
            onClick={() => !isCancelling && setIsCancelModalOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
            }}
          />
          <div
            style={{
              position: "relative",
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              width: "100%",
              maxWidth: "460px",
              padding: "1.75rem",
              zIndex: 1001,
            }}
            role="dialog"
            aria-modal="true"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#fef2f2",
                    color: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertTriangle size={20} />
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  Cancel Appointment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !isCancelling && setIsCancelModalOpen(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "0.92rem", color: "#475569", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              Are you sure you want to cancel this appointment for{" "}
              <strong>{booking.service?.name}</strong> on{" "}
              <strong>{booking.bookingDate}</strong> from{" "}
              <strong>{formatTime12(booking.startTime)}</strong> to{" "}
              <strong>{formatTime12(booking.endTime)}</strong>?
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
                className="btn btn-secondary btn-md"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCancelling}
                className="btn btn-danger btn-md"
                style={{ minWidth: "130px" }}
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
