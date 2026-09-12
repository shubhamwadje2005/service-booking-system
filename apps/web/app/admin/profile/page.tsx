"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGetAdminMeQuery, useAdminLogoutMutation } from "../../../store/apis";
import {
  Shield,
  Mail,
  Calendar,
  LogOut,
  Briefcase,
  CheckCircle,
  LayoutDashboard,
  Clock,
  ArrowRight,
} from "../../../components/Icons";
import { toast } from "../../../components/Toast";

export default function AdminProfilePage() {
  const router = useRouter();
  const { data, isLoading } = useGetAdminMeQuery();
  const [logout, { isLoading: isLoggingOut }] = useAdminLogoutMutation();

  const user = data?.data;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast.success("Admin logged out successfully.");
      window.location.href = "/admin/login";
    } catch {
      window.location.href = "/admin/login";
    }
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div className="card" style={{ padding: "2.5rem", borderRadius: "14px" }}>
          <div className="skeleton" style={{ height: "36px", width: "40%", borderRadius: "8px", marginBottom: "1.5rem" }} />
          <div className="skeleton" style={{ height: "140px", borderRadius: "10px", marginBottom: "1.5rem" }} />
          <div className="skeleton" style={{ height: "200px", borderRadius: "10px" }} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ maxWidth: "500px", margin: "3rem auto", textAlign: "center" }}>
        <div className="card" style={{ padding: "2.5rem", borderRadius: "14px" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
            Administrator Authentication Required
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            Please authenticate your administrator session.
          </p>
          <Link href="/admin/login" className="btn btn-primary btn-md">
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px" }}>
      {/* Header / Breadcrumb */}
      <div style={{ marginBottom: "2rem", paddingBottom: "1.25rem", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#64748b", marginBottom: "0.5rem" }}>
          <Link href="/admin" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
            Admin Console
          </Link>
          <span>/</span>
          <span style={{ color: "#0f172a", fontWeight: 600 }}>Administrator Profile</span>
        </div>
        <h1 style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", margin: 0 }}>
          Administrator Account & Security
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.98rem", marginTop: "0.35rem" }}>
          Inspect authenticated system administrator credentials, role permissions, and active session details.
        </p>
      </div>

      {/* Admin Identity Hero Card */}
      <div
        className="card"
        style={{
          borderRadius: "16px",
          padding: "2rem",
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.03)",
          marginBottom: "1.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "16px",
              backgroundColor: "#0f172a",
              color: "#ffffff",
              fontSize: "2rem",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(15, 23, 42, 0.25)",
              border: "3px solid #3b82f6",
            }}
          >
            {user.name?.[0]?.toUpperCase() || "A"}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {user.name}
              </h2>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  backgroundColor: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  padding: "0.2rem 0.65rem",
                  borderRadius: "9999px",
                  letterSpacing: "0.05em",
                }}
              >
                <Shield size={13} />
                <span>SYSTEM ADMINISTRATOR</span>
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.4rem", flexWrap: "wrap", fontSize: "0.88rem", color: "#64748b" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Mail size={14} />
                <span>{user.email}</span>
              </span>
              <span>•</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "#059669", fontWeight: 600 }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981", display: "inline-block" }} />
                <span>Active Session</span>
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="btn btn-secondary btn-md"
          style={{
            color: "#dc2626",
            borderColor: "#fecaca",
            backgroundColor: "#fff",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <LogOut size={16} />
          <span>{isLoggingOut ? "Ending Session..." : "Admin Logout"}</span>
        </button>
      </div>

      {/* 2-Column Grid: Account Specs & Privileges */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "1.5rem",
          marginBottom: "1.75rem",
        }}
      >
        {/* Column 1: System Credentials */}
        <div
          className="card"
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            padding: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#f8fafc", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Administrative Credentials
              </h3>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Authoritative PostgreSQL record</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.9rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid #f8fafc" }}>
              <span style={{ color: "#64748b" }}>Admin Full Name</span>
              <strong style={{ color: "#0f172a" }}>{user.name}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid #f8fafc" }}>
              <span style={{ color: "#64748b" }}>Registered Email</span>
              <strong style={{ color: "#0f172a" }}>{user.email}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid #f8fafc" }}>
              <span style={{ color: "#64748b" }}>Database Role</span>
              <span style={{ fontWeight: 800, color: "#2563eb", backgroundColor: "#eff6ff", padding: "0.15rem 0.5rem", borderRadius: "6px" }}>
                {user.role}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid #f8fafc" }}>
              <span style={{ color: "#64748b" }}>Admin UID</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#475569" }}>
                {user.id ? `${user.id.slice(0, 12)}...` : "—"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Registered Since</span>
              <span style={{ color: "#0f172a", fontWeight: 600 }}>
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: System Permissions Matrix */}
        <div
          className="card"
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            padding: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Permission & Access Matrix
              </h3>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Role-based authorization privileges</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", padding: "0.6rem 0.75rem", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
              <CheckCircle size={16} style={{ color: "#059669", marginTop: "2px", flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>
                  Full Services Catalog Management
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Create new offerings, modify prices & durations, or delete services.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", padding: "0.6rem 0.75rem", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
              <CheckCircle size={16} style={{ color: "#059669", marginTop: "2px", flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>
                  Authoritative Booking Transitions
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Confirm customer appointments, mark completed, or cancel with audit logs.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", padding: "0.6rem 0.75rem", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
              <CheckCircle size={16} style={{ color: "#059669", marginTop: "2px", flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>
                  Operations Analytics & Revenue KPI
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Inspect platform revenue totals, bookings count, and system statistics.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Shortcuts to Admin Operations */}
      <div
        className="card"
        style={{
          borderRadius: "14px",
          padding: "1.5rem 2rem",
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
        }}
      >
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.04em", marginBottom: "1rem" }}>
          Quick Platform Operations
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          <Link
            href="/admin"
            className="btn btn-secondary btn-md"
            style={{
              justifyContent: "flex-start",
              gap: "0.6rem",
              padding: "0.85rem 1rem",
              borderRadius: "10px",
            }}
          >
            <LayoutDashboard size={18} style={{ color: "#2563eb" }} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>Operations Dashboard</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Overview & KPI stats</div>
            </div>
          </Link>

          <Link
            href="/admin/bookings"
            className="btn btn-secondary btn-md"
            style={{
              justifyContent: "flex-start",
              gap: "0.6rem",
              padding: "0.85rem 1rem",
              borderRadius: "10px",
            }}
          >
            <Calendar size={18} style={{ color: "#059669" }} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>Bookings Operations</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Manage & confirm appointments</div>
            </div>
          </Link>

          <Link
            href="/admin/services"
            className="btn btn-secondary btn-md"
            style={{
              justifyContent: "flex-start",
              gap: "0.6rem",
              padding: "0.85rem 1rem",
              borderRadius: "10px",
            }}
          >
            <Briefcase size={18} style={{ color: "#d97706" }} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0f172a" }}>Services Catalog</div>
              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Add & edit services</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
