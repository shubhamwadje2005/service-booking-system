"use client";

import React from "react";
import Link from "next/link";
import { useGetAdminDashboardStatsQuery, useGetAdminMeQuery } from "../../store/apis";
import { BookingStatus } from "@repo/types";
import {
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Briefcase,
  ArrowRight,
  Shield,
  Eye,
  AlertTriangle,
  RefreshCw,
} from "../../components/Icons";

// ==========================================
// COLOCATED METRIC CARD
// ==========================================
function MetricCard({
  label,
  value,
  subtext,
  icon,
  isAccent = false,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  isAccent?: boolean;
}) {
  return (
    <div
      className="card"
      style={{
        padding: "1.25rem 1.5rem",
        backgroundColor: isAccent ? "#0f172a" : "#ffffff",
        color: isAccent ? "#ffffff" : "#0f172a",
        border: isAccent ? "1px solid #1e293b" : "1px solid #e2e8f0",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "135px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span
          style={{
            fontSize: "0.82rem",
            fontWeight: 600,
            color: isAccent ? "#94a3b8" : "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </span>
        {icon && (
          <div
            style={{
              color: isAccent ? "#38bdf8" : "#2563eb",
              backgroundColor: isAccent ? "rgba(255, 255, 255, 0.08)" : "#f1f5f9",
              padding: "0.45rem",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ marginTop: "0.5rem" }}>
        <div
          style={{
            fontSize: "1.85rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
        {subtext && (
          <div
            style={{
              fontSize: "0.78rem",
              color: isAccent ? "#cbd5e1" : "#64748b",
              marginTop: "0.35rem",
            }}
          >
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}

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

export default function AdminDashboardPage() {
  const { data: adminData, isLoading: isUserLoading } = useGetAdminMeQuery();
  const currentUser = adminData?.data;
  const isAdmin = currentUser?.role === "ADMIN";

  const {
    data: statsData,
    isLoading: isStatsLoading,
    isError,
    refetch,
  } = useGetAdminDashboardStatsQuery(undefined, { skip: !isAdmin });

  const stats = statsData?.data;

  // Access check
  if (!isUserLoading && !isAdmin) {
    return (
      <div style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
        <div className="card" style={{ maxWidth: "520px", margin: "0 auto", padding: "3rem 2rem", border: "1px solid #fecaca" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <Shield size={28} />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>
            Admin Access Required
          </h2>
          <p style={{ color: "#64748b", marginBottom: "1.75rem", fontSize: "0.95rem" }}>
            You must be signed in with an administrative account to access business performance analytics.
          </p>
          <Link href="/admin/login" className="btn btn-primary btn-md">
            Sign In with Admin Account
          </Link>
        </div>
      </div>
    );
  }

  const formatTime12 = (time24?: string) => {
    if (!time24) return "—";
    const [hStr, mStr] = time24.split(":");
    let h = parseInt(hStr || "0", 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${mStr} ${ampm}`;
  };

  const totalB = stats?.totalBookings || 0;
  const pendingB = stats?.pendingBookings || 0;
  const confirmedB = stats?.confirmedBookings || 0;
  const completedB = stats?.completedBookings || 0;
  const cancelledB = stats?.cancelledBookings || 0;

  const pendingPct = totalB > 0 ? (pendingB / totalB) * 100 : 0;
  const confirmedPct = totalB > 0 ? (confirmedB / totalB) * 100 : 0;
  const completedPct = totalB > 0 ? (completedB / totalB) * 100 : 0;
  const cancelledPct = totalB > 0 ? (cancelledB / totalB) * 100 : 0;

  const recentBookings = stats?.recentBookings || [];

  return (
    <div>
      {/* Dashboard Title & Live Feed Badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Operations Dashboard
            </h1>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.2rem 0.55rem",
                borderRadius: "9999px",
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#047857",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#059669" }} />
              <span>Live Feed</span>
            </div>
          </div>
          <p style={{ color: "#64748b", fontSize: "0.95rem", margin: 0 }}>
            Real-time platform metrics, booking allocations, and realized revenue from PostgreSQL.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/admin/bookings" className="btn btn-secondary btn-sm">
            Manage Bookings
          </Link>
          <Link href="/admin/services" className="btn btn-primary btn-sm">
            Manage Services
          </Link>
        </div>
      </div>

      {/* Loading Skeleton (Matching Reference) */}
      {isStatsLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div className="skeleton-line-title" style={{ width: "50%" }} />
                  <div className="skeleton-circle" style={{ width: "28px", height: "28px" }} />
                </div>
                <div className="skeleton-line-title" style={{ height: "24px", width: "70%" }} />
                <div className="skeleton-line-subtitle" style={{ width: "40%" }} />
              </div>
            ))}
          </div>
          <div className="skeleton-card" style={{ padding: "1.5rem" }}>
            <div className="skeleton-thumb" style={{ height: "200px" }} />
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && !isStatsLoading && (
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
            Failed to retrieve analytics
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: "1.75rem" }}>
            Could not load dashboard statistics from /api/admin/dashboard/stats.
          </p>
          <button onClick={() => refetch()} className="btn btn-primary btn-sm">
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Stats Content */}
      {!isStatsLoading && !isError && stats && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* 8 Real Metric Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "1.25rem",
            }}
          >
            <MetricCard
              label="Realized Revenue"
              value={`₹${Number(stats.totalRevenue || 0).toLocaleString()}`}
              subtext="From completed bookings"
              icon={<DollarSign size={20} />}
              isAccent={true}
            />
            <MetricCard
              label="Total Bookings"
              value={totalB}
              subtext="All-time appointment volume"
              icon={<Calendar size={20} />}
            />
            <MetricCard
              label="Pending Bookings"
              value={pendingB}
              subtext="Awaiting admin confirmation"
              icon={<Clock size={20} />}
            />
            <MetricCard
              label="Confirmed Bookings"
              value={confirmedB}
              subtext="Scheduled and locked in"
              icon={<CheckCircle size={20} />}
            />
            <MetricCard
              label="Completed Bookings"
              value={completedB}
              subtext="Successfully delivered"
              icon={<CheckCircle size={20} />}
            />
            <MetricCard
              label="Cancelled Bookings"
              value={cancelledB}
              subtext="Slots returned to pool"
              icon={<XCircle size={20} />}
            />
            <MetricCard
              label="Registered Customers"
              value={stats.totalCustomers || 0}
              subtext="Customer accounts created"
              icon={<User size={20} />}
            />
            <MetricCard
              label="Active Services"
              value={stats.activeServices || 0}
              subtext="Currently listed in catalog"
              icon={<Briefcase size={20} />}
            />
          </div>

          {/* Status Distribution Progress Bar */}
          <div
            className="card"
            style={{
              padding: "1.75rem",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>
              Booking Status Distribution
            </h2>

            {totalB > 0 ? (
              <div>
                <div
                  style={{
                    height: "12px",
                    borderRadius: "9999px",
                    overflow: "hidden",
                    display: "flex",
                    backgroundColor: "#f1f5f9",
                    marginBottom: "1.25rem",
                  }}
                >
                  <div style={{ width: `${completedPct}%`, backgroundColor: "#059669" }} title={`Completed: ${completedPct.toFixed(1)}%`} />
                  <div style={{ width: `${confirmedPct}%`, backgroundColor: "#2563eb" }} title={`Confirmed: ${confirmedPct.toFixed(1)}%`} />
                  <div style={{ width: `${pendingPct}%`, backgroundColor: "#d97706" }} title={`Pending: ${pendingPct.toFixed(1)}%`} />
                  <div style={{ width: `${cancelledPct}%`, backgroundColor: "#dc2626" }} title={`Cancelled: ${cancelledPct.toFixed(1)}%`} />
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#059669" }} />
                    <span style={{ color: "#64748b" }}>Completed:</span>
                    <strong style={{ color: "#0f172a" }}>{completedB} ({completedPct.toFixed(0)}%)</strong>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#2563eb" }} />
                    <span style={{ color: "#64748b" }}>Confirmed:</span>
                    <strong style={{ color: "#0f172a" }}>{confirmedB} ({confirmedPct.toFixed(0)}%)</strong>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#d97706" }} />
                    <span style={{ color: "#64748b" }}>Pending:</span>
                    <strong style={{ color: "#0f172a" }}>{pendingB} ({pendingPct.toFixed(0)}%)</strong>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#dc2626" }} />
                    <span style={{ color: "#64748b" }}>Cancelled:</span>
                    <strong style={{ color: "#0f172a" }}>{cancelledB} ({cancelledPct.toFixed(0)}%)</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: "#64748b", fontSize: "0.9rem" }}>
                No bookings recorded yet. Once appointments are placed, status distribution will calculate automatically.
              </div>
            )}
          </div>

          {/* Recent Bookings Feed */}
          <div
            className="card"
            style={{
              padding: "1.75rem",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  Recent Bookings Feed
                </h2>
                <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                  Latest appointment orders placed by customers
                </span>
              </div>
              <Link href="/admin/bookings" className="btn btn-secondary btn-sm">
                <span>View All Bookings</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.92rem" }}>
                No recent booking activity recorded.
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Service</th>
                      <th>Date</th>
                      <th>Time Window</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((b) => (
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
                        <td>{b.bookingDate}</td>
                        <td>
                          {formatTime12(b.startTime)} – {formatTime12(b.endTime)}
                        </td>
                        <td>
                          <strong style={{ color: "#0f172a" }}>₹{Number(b.amount).toFixed(0)}</strong>
                        </td>
                        <td>
                          <StatusBadge status={b.status} />
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <Link
                            href="/admin/bookings"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "0.3rem 0.6rem" }}
                          >
                            <Eye size={14} />
                            <span>Inspect</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
