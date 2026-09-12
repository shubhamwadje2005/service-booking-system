"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGetMeQuery, useLogoutMutation } from "../../store/apis";
import {
  User as UserIcon,
  Mail,
  Shield,
  Calendar,
  LogOut,
  ArrowRight,
  Briefcase,
} from "../../components/Icons";
import { toast } from "../../components/Toast";

export default function ProfilePage() {
  const router = useRouter();
  const { data, isLoading } = useGetMeQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const user = data?.data;

  useEffect(() => {
    if (user?.role === "ADMIN") {
      router.replace("/admin/profile");
    }
  }, [user, router]);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast.success("Logged out successfully");
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ maxWidth: "600px", paddingTop: "2rem" }}>
        <div className="card" style={{ padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="skeleton" style={{ height: "32px", width: "40%", borderRadius: "6px" }} />
          <div className="skeleton" style={{ height: "20px", width: "70%", borderRadius: "6px" }} />
          <div className="skeleton" style={{ height: "120px", borderRadius: "10px" }} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container" style={{ maxWidth: "540px", paddingTop: "3rem", textAlign: "center" }}>
        <div className="card" style={{ padding: "3rem 2rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.75rem" }}>
            Sign In Required
          </h2>
          <p style={{ color: "#64748b", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
            Please sign in to view and manage your account profile.
          </p>
          <Link href="/login" className="btn btn-primary btn-md">
            Sign In to Account
          </Link>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="container" style={{ maxWidth: "680px", paddingTop: "1rem" }}>
      <div
        className="card"
        style={{
          borderRadius: "16px",
          padding: "2.5rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        }}
      >
        {/* Header Profile Info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
            paddingBottom: "2rem",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: isAdmin ? "#2563eb" : "#0f172a",
              color: "#ffffff",
              fontSize: "1.75rem",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {user.name[0]?.toUpperCase()}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                {user.name}
              </h1>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  backgroundColor: isAdmin ? "#eff6ff" : "#f1f5f9",
                  color: isAdmin ? "#1d4ed8" : "#475569",
                  border: `1px solid ${isAdmin ? "#bfdbfe" : "#e2e8f0"}`,
                  padding: "0.2rem 0.6rem",
                  borderRadius: "9999px",
                  textTransform: "uppercase",
                }}
              >
                {user.role}
              </span>
            </div>
            <p style={{ color: "#64748b", fontSize: "0.92rem", margin: "0.25rem 0 0" }}>
              {user.email}
            </p>
          </div>
        </div>

        {/* Account Details */}
        <div style={{ padding: "1.75rem 0", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h3 style={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.04em", margin: 0 }}>
            Account Information
          </h3>

          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.85rem",
              fontSize: "0.92rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Mail size={15} />
                <span>Email Address</span>
              </span>
              <span style={{ fontWeight: 600, color: "#0f172a" }}>{user.email}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Shield size={15} />
                <span>Account Role</span>
              </span>
              <span style={{ fontWeight: 600, color: "#0f172a" }}>{user.role}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Calendar size={15} />
                <span>Member Since</span>
              </span>
              <span style={{ fontWeight: 600, color: "#0f172a" }}>
                {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingTop: "0.5rem" }}>
          {isAdmin ? (
            <Link href="/admin" className="btn btn-primary btn-md" style={{ justifyContent: "center" }}>
              <span>Go to Admin Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <Link href="/bookings" className="btn btn-primary btn-md" style={{ justifyContent: "center" }}>
              <span>View My Bookings</span>
              <ArrowRight size={16} />
            </Link>
          )}

          <Link href="/services" className="btn btn-secondary btn-md" style={{ justifyContent: "center" }}>
            Explore Services
          </Link>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="btn btn-secondary btn-md"
            style={{ justifyContent: "center", color: "#dc2626", borderColor: "#fecaca" }}
          >
            <LogOut size={16} />
            <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
