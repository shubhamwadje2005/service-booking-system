"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  useGetAdminBookingsQuery,
  useUpdateAdminBookingStatusMutation,
  useGetAdminMeQuery,
} from "../../../store/apis";
import { Booking, BookingStatus } from "@repo/types";
import { toast } from "../../../components/Toast";
import {
  Search,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  X,
  AlertTriangle,
  RefreshCw,
} from "../../../components/Icons";

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

export default function AdminBookingsPage() {
  const { data: adminData } = useGetAdminMeQuery();
  const currentUser = adminData?.data;
  const isAdmin = currentUser?.role === "ADMIN";

  // Filter states
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const {
    data: bookingsData,
    isLoading: isBookingsLoading,
    isError,
    refetch,
  } = useGetAdminBookingsQuery(
    {
      page,
      limit,
      status: statusFilter ? (statusFilter as BookingStatus) : undefined,
      date: dateFilter || undefined,
      search: search.trim() || undefined,
    },
    { skip: !isAdmin }
  );

  const [updateStatus, { isLoading: isUpdating }] = useUpdateAdminBookingStatusMutation();

  // Modals
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusChangeTarget, setStatusChangeTarget] = useState<{
    booking: Booking;
    nextStatus: BookingStatus;
  } | null>(null);

  const bookingsList = bookingsData?.data?.items || [];
  const pagination = bookingsData?.data;

  const handleExecuteStatusUpdate = async () => {
    if (!statusChangeTarget) return;
    try {
      const res = await updateStatus({
        id: statusChangeTarget.booking.id,
        status: statusChangeTarget.nextStatus,
      }).unwrap();

      if (res.success) {
        toast.success(`Booking status changed to ${statusChangeTarget.nextStatus}`);
        if (selectedBooking && selectedBooking.id === statusChangeTarget.booking.id) {
          setSelectedBooking(res.data || null);
        }
        setStatusChangeTarget(null);
        refetch();
      }
    } catch (err: any) {
      if (err?.status === 409) {
        toast.error("This booking conflicts with another booking for the same service and time.");
        refetch();
      } else {
        toast.error(err?.data?.message || "Failed to update booking status.");
      }
      setStatusChangeTarget(null);
    }
  };

  const handleDirectStatusUpdate = async (booking: Booking, nextStatus: BookingStatus) => {
    try {
      const res = await updateStatus({
        id: booking.id,
        status: nextStatus,
      }).unwrap();

      if (res.success) {
        toast.success(`Booking marked as ${nextStatus}`);
        if (selectedBooking && selectedBooking.id === booking.id) {
          setSelectedBooking(res.data || null);
        }
        refetch();
      }
    } catch (err: any) {
      if (err?.status === 409) {
        toast.error("This booking conflicts with another booking for the same service and time.");
        refetch();
      } else {
        toast.error(err?.data?.message || "Failed to update booking status.");
      }
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

  return (
    <div>
      {/* Top Header */}
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
            Booking Operations Console
          </h1>
          <p style={{ color: "#64748b", fontSize: "1rem", margin: 0 }}>
            Inspect customer orders, verify schedules, and execute authoritative status transitions.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="btn btn-secondary btn-sm"
          style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
        >
          <RefreshCw size={14} />
          <span>Refresh Bookings</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          backgroundColor: "#ffffff",
          padding: "1rem 1.25rem",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          marginBottom: "1.75rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
        }}
      >
        {/* Search by Customer / Email */}
        <div style={{ position: "relative", flex: 1, minWidth: "min(100%, 200px)" }}>
          <div
            style={{
              position: "absolute",
              left: "0.85rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              pointerEvents: "none",
              display: "flex",
            }}
          >
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search customer name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="form-input"
            style={{ paddingLeft: "2.4rem", height: "40px" }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ minWidth: "160px" }}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="form-select"
            style={{ height: "40px" }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        {/* Date Filter */}
        <div style={{ minWidth: "160px" }}>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            className="form-input"
            style={{ height: "40px" }}
          />
        </div>

        {/* Reset Filters */}
        {(search || statusFilter || dateFilter) && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setDateFilter("");
              setPage(1);
            }}
            className="btn btn-secondary btn-sm"
            style={{ height: "40px" }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Loading Skeleton Grid (Matching Reference) */}
      {isBookingsLoading && (
        <div className="skeleton-grid" style={{ marginBottom: "2rem" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-thumb" style={{ height: "130px" }} />
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
      {isError && !isBookingsLoading && (
        <div
          style={{
            padding: "3.5rem 1.5rem",
            textAlign: "center",
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #fee2e2",
            margin: "2rem auto",
            maxWidth: "520px",
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
            Unable to load bookings
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: "1.75rem" }}>
            Failed to retrieve bookings from /api/admin/bookings.
          </p>
          <button onClick={() => refetch()} className="btn btn-primary btn-sm">
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isBookingsLoading && !isError && bookingsList.length === 0 && (
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
            No bookings found
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
            {search || statusFilter || dateFilter
              ? "No booking records match your active search filters."
              : "No customer appointment orders have been placed yet."}
          </p>
          {(search || statusFilter || dateFilter) && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setDateFilter("");
                setPage(1);
              }}
              className="btn btn-secondary btn-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Bookings Data Presentation */}
      {!isBookingsLoading && !isError && bookingsList.length > 0 && (
        <>
          {/* Desktop Table */}
          <div className="table-container desktop-admin-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Time Window</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookingsList.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div>
                        <span style={{ fontWeight: 700, color: "#0f172a", display: "block" }}>
                          {b.customer?.name || "Customer"}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          {b.customer?.email || "—"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: "#334155" }}>
                        {b.service?.name || "Service"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Calendar size={14} style={{ color: "#64748b" }} />
                        <span>{b.bookingDate}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Clock size={14} style={{ color: "#64748b" }} />
                        <span>{formatTime12(b.startTime)} – {formatTime12(b.endTime)}</span>
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: "#0f172a" }}>₹{Number(b.amount).toFixed(0)}</strong>
                    </td>
                    <td>
                      <StatusBadge status={b.status} />
                    </td>
                    <td>
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        {new Date(b.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                        <select
                          value={b.status}
                          disabled={isUpdating}
                          onChange={(e) => handleDirectStatusUpdate(b, e.target.value as BookingStatus)}
                          className="form-select"
                          style={{
                            height: "32px",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            padding: "0.15rem 0.5rem",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            cursor: "pointer",
                            width: "auto",
                          }}
                          title="Change status directly"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => setSelectedBooking(b)}
                          className="btn btn-secondary btn-sm"
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.35rem 0.6rem" }}
                          title="View booking details"
                        >
                          <Eye size={13} />
                          <span>Manage</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="mobile-admin-cards" style={{ display: "none", flexDirection: "column", gap: "1rem" }}>
            {bookingsList.map((b) => (
              <div
                key={b.id}
                className="card"
                style={{
                  padding: "1.25rem",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <div>
                    <span style={{ fontWeight: 700, color: "#0f172a", display: "block" }}>
                      {b.customer?.name}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {b.customer?.email}
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
                    gap: "0.35rem",
                    fontSize: "0.85rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>{b.service?.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#64748b" }}>
                    <Calendar size={14} />
                    <span>{b.bookingDate}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#64748b" }}>
                    <Clock size={14} />
                    <span>{formatTime12(b.startTime)} – {formatTime12(b.endTime)}</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                    ₹{Number(b.amount).toFixed(0)}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <select
                      value={b.status}
                      disabled={isUpdating}
                      onChange={(e) => handleDirectStatusUpdate(b, e.target.value as BookingStatus)}
                      className="form-select"
                      style={{
                        height: "32px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        padding: "0.15rem 0.5rem",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#ffffff",
                        cursor: "pointer",
                        width: "auto",
                      }}
                      title="Change status directly"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setSelectedBooking(b)}
                      className="btn btn-secondary btn-sm"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "1.5rem",
                paddingTop: "1.25rem",
                borderTop: "1px solid #e2e8f0",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total bookings)
              </span>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn btn-secondary btn-sm"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn btn-secondary btn-sm"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Booking Details & Status Transition Dialog */}
      {selectedBooking && (
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
            onClick={() => setSelectedBooking(null)}
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
              maxWidth: "580px",
              padding: "1.75rem",
              zIndex: 1001,
            }}
            role="dialog"
            aria-modal="true"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Manage Booking Appointment
                </h3>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Reference: {selectedBooking.id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  fontSize: "0.92rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#64748b" }}>Current Status</span>
                  <StatusBadge status={selectedBooking.status} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Customer</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>
                    {selectedBooking.customer?.name} ({selectedBooking.customer?.email})
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Service</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>{selectedBooking.service?.name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Appointment Date</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>{selectedBooking.bookingDate}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Time Window</span>
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>
                    {formatTime12(selectedBooking.startTime)} – {formatTime12(selectedBooking.endTime)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Amount</span>
                  <span style={{ fontWeight: 800, color: "#0f172a" }}>₹{Number(selectedBooking.amount).toFixed(0)}</span>
                </div>
              </div>

              {/* Status Transition Action Buttons */}
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.04em", marginBottom: "0.75rem" }}>
                  Change Booking Status
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem" }}>
                  <button
                    type="button"
                    disabled={isUpdating || selectedBooking.status === "CONFIRMED"}
                    onClick={() => handleDirectStatusUpdate(selectedBooking, "CONFIRMED")}
                    className="btn btn-md"
                    style={{
                      backgroundColor: selectedBooking.status === "CONFIRMED" ? "#eff6ff" : "#2563eb",
                      color: selectedBooking.status === "CONFIRMED" ? "#1e40af" : "#ffffff",
                      border: selectedBooking.status === "CONFIRMED" ? "1px solid #bfdbfe" : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <CheckCircle size={15} />
                    <span>{selectedBooking.status === "CONFIRMED" ? "Confirmed ✓" : "Confirm Booking"}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isUpdating || selectedBooking.status === "COMPLETED"}
                    onClick={() => handleDirectStatusUpdate(selectedBooking, "COMPLETED")}
                    className="btn btn-md"
                    style={{
                      backgroundColor: selectedBooking.status === "COMPLETED" ? "#ecfdf5" : "#059669",
                      color: selectedBooking.status === "COMPLETED" ? "#065f46" : "#ffffff",
                      border: selectedBooking.status === "COMPLETED" ? "1px solid #a7f3d0" : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <CheckCircle size={15} />
                    <span>{selectedBooking.status === "COMPLETED" ? "Completed ✓" : "Mark Completed"}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isUpdating || selectedBooking.status === "CANCELLED"}
                    onClick={() => handleDirectStatusUpdate(selectedBooking, "CANCELLED")}
                    className="btn btn-md"
                    style={{
                      backgroundColor: selectedBooking.status === "CANCELLED" ? "#fef2f2" : "#dc2626",
                      color: selectedBooking.status === "CANCELLED" ? "#991b1b" : "#ffffff",
                      border: selectedBooking.status === "CANCELLED" ? "1px solid #fecaca" : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <XCircle size={15} />
                    <span>{selectedBooking.status === "CANCELLED" ? "Cancelled ✓" : "Cancel Booking"}</span>
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="btn btn-secondary btn-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transition Confirmation Dialog */}
      {statusChangeTarget && (
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
            onClick={() => setStatusChangeTarget(null)}
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
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Confirm Transition to {statusChangeTarget.nextStatus}
              </h3>
              <button
                type="button"
                onClick={() => setStatusChangeTarget(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "0.92rem", color: "#475569", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              Are you sure you want to update this customer&apos;s booking status to <strong>{statusChangeTarget.nextStatus}</strong>?
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setStatusChangeTarget(null)}
                disabled={isUpdating}
                className="btn btn-secondary btn-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteStatusUpdate}
                disabled={isUpdating}
                className="btn btn-primary btn-md"
              >
                {isUpdating ? "Updating..." : "Execute Transition"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
