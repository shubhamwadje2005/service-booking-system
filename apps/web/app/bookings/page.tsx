"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  useGetMyBookingsQuery,
  useCancelBookingMutation,
  useGetMeQuery,
} from "../../store/apis";
import { Booking, BookingStatus } from "@repo/types";
import { toast } from "../../components/Toast";
import {
  Calendar,
  Clock,
  ArrowRight,
  XCircle,
  Eye,
  AlertTriangle,
  Briefcase,
  CheckCircle,
  RefreshCw,
  X,
  User as UserIcon,
} from "../../components/Icons";

// ==========================================
// COLOCATED STATUS BADGE
// ==========================================
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
        padding: "0.2rem 0.55rem",
        borderRadius: "9999px",
        fontSize: "0.75rem",
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

// ==========================================
// MAIN CUSTOMER BOOKINGS PAGE
// ==========================================
export default function CustomerBookingsPage() {
  const { data: meData, isLoading: isUserLoading } = useGetMeQuery();
  const currentUser = meData?.data;
  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role === "ADMIN";

  const { data, isLoading, isError, refetch } = useGetMyBookingsQuery(undefined, {
    skip: !isAuthenticated,
    refetchOnMountOrArgChange: true,
    pollingInterval: 3000,
  });
  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation();

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);

  const allBookings = data?.data || [];

  // Metrics counts
  const totalCount = allBookings.length;
  const pendingCount = allBookings.filter((b) => b.status === "PENDING").length;
  const confirmedCount = allBookings.filter((b) => b.status === "CONFIRMED").length;
  const completedCount = allBookings.filter((b) => b.status === "COMPLETED").length;
  const cancelledCount = allBookings.filter((b) => b.status === "CANCELLED").length;

  // Filter bookings based on active status filter tab
  const filteredBookings = statusFilter === "ALL"
    ? allBookings
    : allBookings.filter((b) => b.status === statusFilter);

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    try {
      const res = await cancelBooking(bookingToCancel.id).unwrap();
      if (res.success) {
        toast.success("Appointment cancelled successfully.");
        setBookingToCancel(null);
        refetch();
      }
    } catch (err: any) {
      const msg = err?.data?.message || "Failed to cancel booking. It may already be completed.";
      toast.error(msg);
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

  const filterTabs = [
    { id: "ALL", label: "All Bookings", count: totalCount },
    { id: "PENDING", label: "Pending", count: pendingCount },
    { id: "CONFIRMED", label: "Confirmed", count: confirmedCount },
    { id: "COMPLETED", label: "Completed", count: completedCount },
    { id: "CANCELLED", label: "Cancelled", count: cancelledCount },
  ];

  if (!isUserLoading && !isAuthenticated) {
    return (
      <div className="container" style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
        <div
          className="card"
          style={{
            maxWidth: "520px",
            margin: "0 auto",
            padding: "3.5rem 2rem",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}
          >
            <Calendar size={28} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>
            Sign In to View Your Bookings
          </h2>
          <p style={{ color: "#64748b", marginBottom: "2rem", fontSize: "0.95rem", lineHeight: 1.6 }}>
            Please sign in with your customer account to view your appointment history, check live confirmation status, and manage your bookings.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Link
              href="/login?redirect=/bookings"
              className="btn btn-primary btn-md"
              style={{ justifyContent: "center" }}
            >
              <span>Sign In to Customer Account</span>
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/services"
              className="btn btn-secondary btn-md"
              style={{ justifyContent: "center" }}
            >
              Browse Services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Administrator Mode Banner */}
      {isAdmin && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
            padding: "0.85rem 1.25rem",
            borderRadius: "10px",
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
            color: "#1e40af",
          }}
        >
          <span>
            <strong>Administrator Mode:</strong> You are viewing customer-side bookings. To manage, confirm, and update appointments across all customers, open the Admin Console.
          </span>
          <Link href="/admin/bookings" className="btn btn-primary btn-sm">
            <span>Admin Bookings Console</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "1.25rem",
          marginBottom: "2rem",
          paddingBottom: "1.5rem",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
              marginBottom: "0.35rem",
            }}
          >
            My Bookings
          </h1>
          <p style={{ color: "#64748b", fontSize: "1rem", margin: 0 }}>
            Track and manage your scheduled appointments.
          </p>
        </div>

        <Link href="/services" className="btn btn-primary btn-md">
          <span>+ Book New Service</span>
        </Link>
      </div>

      {/* Top Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem 1.25rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Total</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginTop: "0.25rem" }}>{totalCount}</div>
        </div>
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem 1.25rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#b45309", textTransform: "uppercase" }}>Pending</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#b45309", marginTop: "0.25rem" }}>{pendingCount}</div>
        </div>
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem 1.25rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#1d4ed8", textTransform: "uppercase" }}>Confirmed</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1d4ed8", marginTop: "0.25rem" }}>{confirmedCount}</div>
        </div>
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem 1.25rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#047857", textTransform: "uppercase" }}>Completed</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#047857", marginTop: "0.25rem" }}>{completedCount}</div>
        </div>
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem 1.25rem" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#b91c1c", textTransform: "uppercase" }}>Cancelled</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#b91c1c", marginTop: "0.25rem" }}>{cancelledCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          overflowX: "auto",
          paddingBottom: "0.75rem",
          marginBottom: "1.5rem",
          borderBottom: "1px solid #e2e8f0",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {filterTabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.55rem 1rem",
                borderRadius: "8px",
                border: "1px solid",
                borderColor: isActive ? "#2563eb" : "#e2e8f0",
                backgroundColor: isActive ? "#eff6ff" : "#ffffff",
                color: isActive ? "#1d4ed8" : "#475569",
                fontWeight: isActive ? 700 : 500,
                fontSize: "0.88rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: "0.75rem",
                  backgroundColor: isActive ? "#2563eb" : "#f1f5f9",
                  color: isActive ? "#ffffff" : "#64748b",
                  padding: "0.1rem 0.45rem",
                  borderRadius: "9999px",
                  fontWeight: 600,
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton (Matching Reference) */}
      {isLoading && (
        <div className="skeleton-grid" style={{ marginBottom: "2rem" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-thumb" style={{ height: "140px" }} />
              <div className="skeleton-meta-row">
                <div className="skeleton-circle" />
                <div className="skeleton-lines">
                  <div className="skeleton-line-title" />
                  <div className="skeleton-line-subtitle" />
                </div>
              </div>
            </div>
          ))}
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
            Unable to load appointments
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: "1.75rem" }}>
            We could not retrieve your scheduled bookings. Please check your network and retry.
          </p>
          <button onClick={() => refetch()} className="btn btn-primary btn-sm">
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Empty States */}
      {!isLoading && !isError && allBookings.length === 0 && (
        <div
          style={{
            padding: "4rem 1.5rem",
            textAlign: "center",
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            border: "1px dashed #cbd5e1",
            maxWidth: "520px",
            margin: "2rem auto",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "#f1f5f9",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}
          >
            <Calendar size={26} />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
            No bookings yet
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: "1.75rem" }}>
            Explore our certified services catalog and schedule your very first appointment.
          </p>
          <Link href="/services" className="btn btn-primary btn-md">
            Explore Services
          </Link>
        </div>
      )}

      {!isLoading && !isError && allBookings.length > 0 && filteredBookings.length === 0 && (
        <div
          className="card"
          style={{
            padding: "3rem",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          No appointments found matching the &quot;{statusFilter}&quot; filter.
        </div>
      )}

      {!isLoading && !isError && filteredBookings.length > 0 && (
        <>
          {/* Desktop Table View */}
          <div className="table-container desktop-bookings-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Appointment Date</th>
                  <th>Time Window</th>
                  <th>Duration</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => {
                  const canCancel = b.status === "PENDING" || b.status === "CONFIRMED";
                  return (
                    <tr key={b.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "6px",
                              backgroundColor: "#f1f5f9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#2563eb",
                            }}
                          >
                            <Briefcase size={16} />
                          </div>
                          <div>
                            <span style={{ fontWeight: 700, color: "#0f172a", display: "block" }}>
                              {b.service?.name || "Service Appointment"}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                              Ref: {b.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#334155" }}>
                          <Calendar size={14} style={{ color: "#64748b" }} />
                          <span style={{ fontWeight: 500 }}>{b.bookingDate}</span>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#334155" }}>
                          <Clock size={14} style={{ color: "#64748b" }} />
                          <span style={{ fontWeight: 500 }}>
                            {formatTime12(b.startTime)} – {formatTime12(b.endTime)}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span style={{ color: "#64748b", fontSize: "0.88rem" }}>
                          {b.service?.duration || 60} mins
                        </span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>
                          ₹{Number(b.amount).toFixed(0)}
                        </span>
                      </td>

                      <td>
                        <StatusBadge status={b.status} />
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                          <Link
                            href={`/bookings/${b.id}`}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "0.35rem 0.65rem" }}
                            title="View appointment details"
                          >
                            <Eye size={14} />
                            <span>Details</span>
                          </Link>

                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => setBookingToCancel(b)}
                              className="btn btn-danger btn-sm"
                              style={{ padding: "0.35rem 0.65rem" }}
                              title="Cancel appointment"
                            >
                              <XCircle size={14} />
                              <span>Cancel</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="mobile-bookings-cards">
            {filteredBookings.map((b) => {
              const canCancel = b.status === "PENDING" || b.status === "CONFIRMED";
              return (
                <div
                  key={b.id}
                  className="card"
                  style={{
                    padding: "1.25rem",
                    marginBottom: "1rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                        {b.service?.name || "Service Appointment"}
                      </h3>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        Ref: {b.id.slice(0, 8)}
                      </span>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>

                  <div
                    style={{
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      padding: "0.75rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.4rem",
                      fontSize: "0.85rem",
                      color: "#334155",
                      marginBottom: "1rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Calendar size={14} style={{ color: "#2563eb" }} />
                      <span>{b.bookingDate}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Clock size={14} style={{ color: "#2563eb" }} />
                      <span>
                        {formatTime12(b.startTime)} – {formatTime12(b.endTime)} ({b.service?.duration || 60}m)
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "0.75rem",
                      borderTop: "1px solid #f1f5f9",
                    }}
                  >
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                      ₹{Number(b.amount).toFixed(0)}
                    </span>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => setBookingToCancel(b)}
                          className="btn btn-danger btn-sm"
                        >
                          Cancel
                        </button>
                      )}
                      <Link href={`/bookings/${b.id}`} className="btn btn-secondary btn-sm">
                        <span>Details</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Cancel Confirmation Dialog */}
      {bookingToCancel && (
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
            onClick={() => !isCancelling && setBookingToCancel(null)}
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
                onClick={() => !isCancelling && setBookingToCancel(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "0.92rem", color: "#475569", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              Are you sure you want to cancel your scheduled appointment for{" "}
              <strong>{bookingToCancel.service?.name}</strong> on{" "}
              <strong>{bookingToCancel.bookingDate}</strong> at{" "}
              <strong>{formatTime12(bookingToCancel.startTime)}</strong>?
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                disabled={isCancelling}
                className="btn btn-secondary btn-md"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="btn btn-danger btn-md"
                style={{ minWidth: "130px" }}
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
