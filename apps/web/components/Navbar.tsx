"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useGetMeQuery, useLogoutMutation } from "../store/apis";
import {
  Menu,
  X,
  LogOut,
} from "./Icons";
import { toast } from "./Toast";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: userData, isLoading } = useGetMeQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const user = userData?.data;
  const isAuthenticated = !!user;
  const isAdmin = user?.role === "ADMIN";

  // Close mobile drawer automatically when route/pathname changes or back button is pressed
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handlePopState = () => {
      setMobileMenuOpen(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Handle Escape key & body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      setMobileMenuOpen(false);
      toast.success("Logged out successfully");
      window.location.href = "/login";
    } catch {
      setMobileMenuOpen(false);
      window.location.href = "/login";
    }
  };

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="customer-header">
      <div className="container header-container">
        {/* Left: Brand Logo & Name (Strict Horizontal Row) */}
        <Link
          href="/"
          className="brand-logo-link"
          style={{
            display: "inline-flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "0.65rem",
            textDecoration: "none",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="brand-icon-badge"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "9px",
              background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "1.1rem",
              letterSpacing: "-0.02em",
              flexShrink: 0,
              boxShadow: "0 3px 10px rgba(15, 23, 42, 0.18)",
            }}
          >
            P
          </div>
          <span
            className="brand-logo-text"
            style={{
              fontSize: "1.2rem",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              color: "#0f172a",
              display: "inline-block",
              whiteSpace: "nowrap",
            }}
          >
            ProService
          </span>
        </Link>

        {/* Center: Exactly Home, Services, My Bookings/Admin Console, Profile */}
        <nav className="nav-center-menu" aria-label="Customer Navigation">
          <Link
            href="/"
            className={`nav-link-item ${isActive("/") ? "active" : ""}`}
          >
            Home
          </Link>

          <Link
            href="/services"
            className={`nav-link-item ${isActive("/services") ? "active" : ""}`}
          >
            Services
          </Link>

          {isAdmin ? (
            <>
              <Link
                href="/admin"
                className={`nav-link-item ${isActive("/admin") && pathname !== "/admin/profile" ? "active" : ""}`}
                style={{ color: "#2563eb", fontWeight: 700 }}
              >
                Admin Panel
              </Link>

              <Link
                href="/admin/profile"
                className={`nav-link-item ${isActive("/admin/profile") ? "active" : ""}`}
              >
                Admin Profile
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/bookings"
                className={`nav-link-item ${isActive("/bookings") ? "active" : ""}`}
              >
                My Bookings
              </Link>

              <Link
                href="/profile"
                className={`nav-link-item ${isActive("/profile") ? "active" : ""}`}
              >
                Profile
              </Link>
            </>
          )}
        </nav>

        {/* Right: Sign In / Register (or User Profile Chip + Logout) */}
        <div className="nav-right-actions">
          {!isLoading && (
            <>
              {isAuthenticated ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Link
                    href={isAdmin ? "/admin/profile" : "/profile"}
                    className="user-profile-chip"
                    title={isAdmin ? "View Admin Profile" : "View Profile"}
                  >
                    <div
                      className="user-avatar"
                      style={isAdmin ? { backgroundColor: "#2563eb" } : undefined}
                    >
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="user-name">
                      {user.name}
                    </span>
                    {isAdmin && (
                      <span
                        style={{
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          backgroundColor: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                          padding: "0.1rem 0.4rem",
                          borderRadius: "9999px",
                          marginLeft: "0.2rem",
                        }}
                      >
                        ADMIN
                      </span>
                    )}
                  </Link>

                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="btn btn-secondary btn-sm"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      color: "#475569",
                      padding: "0.45rem 0.85rem",
                      borderRadius: "8px",
                      transition: "all 0.2s ease",
                    }}
                    title="Sign Out"
                  >
                    <LogOut size={15} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <Link
                    href="/login"
                    className="btn-nav-signin"
                  >
                    Sign In
                  </Link>

                  <Link
                    href="/register"
                    className="btn-nav-register"
                  >
                    Register
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="nav-mobile-toggle"
          aria-label="Toggle navigation"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Animated Drawer */}
      {mobileMenuOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileMenuOpen(false);
          }}
        >
          <div className="mobile-nav-panel mobile-nav-panel-animated">
            {/* Header with Horizontal Logo & Close button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.65rem" }}>
                <div
                  className="brand-icon-badge"
                  style={{
                    width: "32px",
                    height: "32px",
                    fontSize: "1rem",
                    borderRadius: "8px",
                  }}
                >
                  P
                </div>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: "1.15rem",
                    color: "#0f172a",
                    letterSpacing: "-0.02em",
                  }}
                >
                  ProService
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  padding: "0.4rem",
                  cursor: "pointer",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Menu Links */}
            <div
              style={{
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.4rem",
                flex: 1,
              }}
            >
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`mobile-nav-link ${isActive("/") ? "active" : ""}`}
              >
                Home
              </Link>

              <Link
                href="/services"
                onClick={() => setMobileMenuOpen(false)}
                className={`mobile-nav-link ${isActive("/services") ? "active" : ""}`}
              >
                Services
              </Link>

              {isAdmin ? (
                <>
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`mobile-nav-link ${isActive("/admin") && pathname !== "/admin/profile" ? "active" : ""}`}
                    style={{ color: "#2563eb", fontWeight: 700 }}
                  >
                    Admin Panel
                  </Link>

                  <Link
                    href="/admin/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`mobile-nav-link ${isActive("/admin/profile") ? "active" : ""}`}
                  >
                    Admin Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/bookings"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`mobile-nav-link ${isActive("/bookings") ? "active" : ""}`}
                  >
                    My Bookings
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`mobile-nav-link ${isActive("/profile") ? "active" : ""}`}
                  >
                    Profile
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Auth Bottom Section */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderTop: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
              }}
            >
              {isAuthenticated ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div
                      className="user-avatar"
                      style={{ width: "36px", height: "36px", fontSize: "0.95rem" }}
                    >
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {user.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "#64748b",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="btn btn-secondary btn-md"
                    style={{ width: "100%", justifyContent: "center", gap: "0.5rem" }}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn btn-secondary btn-md"
                    style={{ justifyContent: "center", fontWeight: 600 }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-nav-register"
                    style={{
                      justifyContent: "center",
                      padding: "0.6rem 1rem",
                      fontSize: "0.95rem",
                    }}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
