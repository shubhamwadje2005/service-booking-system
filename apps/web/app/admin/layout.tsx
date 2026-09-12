"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminLogoutMutation, useGetAdminMeQuery } from "../../store/apis";
import {
  LayoutDashboard,
  Calendar,
  Briefcase,
  User,
  LogOut,
  X,
  Shield,
  Menu,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "../../components/Icons";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 1024) {
      setMobileDrawerOpen((prev) => !prev);
    } else {
      setDesktopSidebarOpen((prev) => !prev);
    }
  };

  const router = useRouter();
  const { data: adminData, isLoading: isUserLoading } = useGetAdminMeQuery();
  const [adminLogout, { isLoading: isLoggingOut }] = useAdminLogoutMutation();
  const user = adminData?.data;

  // Handle unauthenticated redirect (Must be unconditional before any return)
  useEffect(() => {
    if (!isUserLoading && !user && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [isUserLoading, user, pathname, router]);

  // Handle Escape key for mobile drawer (Must be unconditional before any return)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };
    if (mobileDrawerOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileDrawerOpen]);

  // If on /admin/login, render children cleanly without admin chrome
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await adminLogout().unwrap();
      setMobileDrawerOpen(false);
      window.location.href = "/admin/login";
    } catch {
      window.location.href = "/admin/login";
    }
  };

  // 1. Loading State
  if (isUserLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid #e2e8f0",
            borderTopColor: "#2563eb",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            marginBottom: "1rem",
          }}
        />
        <p style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: 600 }}>
          Authenticating admin access...
        </p>
        <style jsx global>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // 2. Unauthenticated State (redirecting)
  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
        }}
      >
        <p style={{ fontSize: "0.9rem", color: "#64748b" }}>
          Redirecting to admin sign in...
        </p>
      </div>
    );
  }

  // 4. Authorized Admin: Enterprise Console
  const navItems = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      exact: true,
    },
    {
      href: "/admin/bookings",
      label: "Bookings Management",
      icon: <Calendar size={20} />,
      exact: false,
    },
    {
      href: "/admin/services",
      label: "Services Management",
      icon: <Briefcase size={20} />,
      exact: false,
    },
    {
      href: "/admin/profile",
      label: "Admin Profile",
      icon: <User size={20} />,
      exact: true,
    },
  ];

  const isNavActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const renderSidebar = (isCollapsed: boolean, isMobile: boolean = false) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: isCollapsed ? "1.25rem 0.5rem" : "1.25rem 1rem",
        backgroundColor: "#ffffff",
        transition: "padding 0.2s ease",
      }}
    >
      {/* Brand / Admin Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "space-between",
          flexDirection: isCollapsed ? "column" : "row",
          gap: isCollapsed ? "0.65rem" : "0",
          paddingBottom: "1.25rem",
          marginBottom: "1.25rem",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <Link
          href="/admin"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            textDecoration: "none",
            color: "#0f172a",
          }}
          title={isCollapsed ? "ProService Admin" : undefined}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              backgroundColor: "#0f172a",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "1rem",
              boxShadow: "0 2px 6px rgba(15, 23, 42, 0.2)",
              flexShrink: 0,
            }}
          >
            P
          </div>
          {!isCollapsed && (
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
                ProService
              </div>
              <div style={{ fontSize: "0.72rem", color: "#2563eb", fontWeight: 700 }}>
                ADMIN PANEL
              </div>
            </div>
          )}
        </Link>

        {/* Toggle / Close Button */}
        {isMobile ? (
          <button
            onClick={() => setMobileDrawerOpen(false)}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              padding: "0.35rem",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        ) : isCollapsed ? (
          <button
            onClick={() => setDesktopSidebarOpen(true)}
            style={{
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              color: "#475569",
              cursor: "pointer",
              padding: "0.3rem",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="admin-sidebar-toggle-btn"
          >
            <ChevronRight size={14} />
          </button>
        ) : (
          <button
            onClick={() => setDesktopSidebarOpen(false)}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              padding: "0.35rem",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
            className="admin-sidebar-close-btn"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: isCollapsed ? "0.5rem" : "0.35rem",
          flex: 1,
        }}
        aria-label="Admin Navigation"
      >
        {isCollapsed ? (
          <div
            style={{
              height: "1px",
              backgroundColor: "#f1f5f9",
              margin: "0.25rem 0.5rem 0.5rem 0.5rem",
            }}
          />
        ) : (
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#94a3b8",
              padding: "0.25rem 0.75rem",
              marginBottom: "0.25rem",
            }}
          >
            Operations Management
          </div>
        )}

        {navItems.map((item) => {
          const active = isNavActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileDrawerOpen(false)}
              title={isCollapsed ? item.label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "flex-start",
                gap: isCollapsed ? 0 : "0.75rem",
                padding: isCollapsed ? "0.65rem 0" : "0.65rem 0.85rem",
                borderRadius: "8px",
                fontSize: "0.9rem",
                fontWeight: active ? 700 : 500,
                color: active ? "#1d4ed8" : "#475569",
                backgroundColor: active ? "#eff6ff" : "transparent",
                border: active ? "1px solid #bfdbfe" : "1px solid transparent",
                textDecoration: "none",
                transition: "all 0.15s ease",
                width: isCollapsed ? "44px" : "100%",
                height: isCollapsed ? "44px" : "auto",
                margin: isCollapsed ? "0 auto" : "0",
              }}
              className={!active ? "admin-nav-item-hover" : ""}
            >
              <span
                style={{
                  color: active ? "#2563eb" : "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </span>
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* Public Storefront Link */}
        <div
          style={{
            marginTop: "1.25rem",
            paddingTop: "0.85rem",
            borderTop: "1px solid #f1f5f9",
          }}
        >
          {!isCollapsed && (
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#94a3b8",
                padding: "0 0.75rem",
                marginBottom: "0.35rem",
              }}
            >
              Storefront
            </div>
          )}
          <Link
            href="/services"
            title={isCollapsed ? "View Public Website" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "flex-start",
              gap: isCollapsed ? 0 : "0.65rem",
              padding: isCollapsed ? "0.65rem 0" : "0.55rem 0.75rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              color: "#64748b",
              textDecoration: "none",
              width: isCollapsed ? "44px" : "100%",
              height: isCollapsed ? "44px" : "auto",
              margin: isCollapsed ? "0 auto" : "0",
            }}
            className="admin-nav-item-hover"
          >
            <span style={{ fontSize: "1.1rem" }}>🌐</span>
            {!isCollapsed && <span>View Public Website</span>}
          </Link>
        </div>
      </nav>

      {/* User Info & Logout Footer */}
      <div
        style={{
          paddingTop: "1.25rem",
          marginTop: "auto",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          alignItems: isCollapsed ? "center" : "stretch",
          gap: "0.75rem",
        }}
      >
        {isCollapsed ? (
          <Link
            href="/admin/profile"
            onClick={() => setMobileDrawerOpen(false)}
            title={`Admin Profile: ${user?.name || "Administrator"} (${user?.email})`}
            className="admin-collapsed-user-avatar"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.85rem",
              fontWeight: 700,
              textDecoration: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {user?.name ? user.name[0]?.toUpperCase() : "A"}
          </Link>
        ) : (
          <Link
            href="/admin/profile"
            onClick={() => setMobileDrawerOpen(false)}
            title="Open Admin Profile"
            className="admin-user-card-link"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.55rem 0.75rem",
              borderRadius: "8px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              textDecoration: "none",
              color: "inherit",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {user?.name ? user.name[0]?.toUpperCase() : "A"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.name || "Administrator"}
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "#64748b",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.email}
              </div>
            </div>
          </Link>
        )}

        {isCollapsed ? (
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={isLoggingOut ? "Signing out..." : "Sign Out"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              border: "1px solid #fecaca",
              backgroundColor: "#ffffff",
              color: "#dc2626",
              cursor: isLoggingOut ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
            className="admin-logout-hover"
            aria-label="Sign Out"
          >
            <LogOut size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.45rem",
              width: "100%",
              padding: "0.55rem",
              borderRadius: "8px",
              border: "1px solid #fecaca",
              backgroundColor: "#ffffff",
              color: "#dc2626",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: isLoggingOut ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
            className="admin-logout-hover"
          >
            <LogOut size={16} />
            <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="admin-root-container">
      {/* Dedicated Admin Topbar */}
      <header className="admin-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <button
            type="button"
            className="admin-topbar-menu-btn"
            onClick={handleToggleSidebar}
            aria-label="Toggle Navigation Sidebar"
            title={desktopSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            <Menu size={20} />
          </button>

          <Link
            href="/admin"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              textDecoration: "none",
              color: "#ffffff",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "0.95rem",
                boxShadow: "0 2px 6px rgba(37, 99, 235, 0.35)",
              }}
            >
              P
            </div>
            <span style={{ fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.02em" }}>
              ProService
            </span>
          </Link>

          <div
            style={{
              width: "1px",
              height: "20px",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              margin: "0 0.15rem",
            }}
          />

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.03em",
              backgroundColor: "rgba(56, 189, 248, 0.1)",
              color: "#38bdf8",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              padding: "0.22rem 0.65rem",
              borderRadius: "9999px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#38bdf8",
              }}
            />
            ADMIN PANEL
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <Link
            href="/services"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "#cbd5e1",
              textDecoration: "none",
              padding: "0.4rem 0.85rem",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              transition: "all 0.15s ease",
            }}
            className="admin-topbar-link-hover"
          >
            <span>Public Site</span>
            <ArrowRight size={13} />
          </Link>

          <Link
            href="/admin/profile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.3rem 0.75rem 0.3rem 0.45rem",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              textDecoration: "none",
              color: "#ffffff",
              transition: "all 0.15s ease",
            }}
            className="admin-topbar-user"
            title="Open Admin Profile"
          >
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                color: "#ffffff",
                fontSize: "0.75rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {user.name[0]?.toUpperCase()}
            </div>
            <span style={{ fontSize: "0.84rem", color: "#f8fafc", fontWeight: 600 }}>
              {user.name}
            </span>
          </Link>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="admin-topbar-logout-btn"
            title="Sign Out"
          >
            <LogOut size={14} />
            <span>{isLoggingOut ? "..." : "Logout"}</span>
          </button>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="admin-layout-wrapper">
        {/* 1. Desktop Persistent Sidebar */}
        <aside className={`admin-desktop-sidebar ${desktopSidebarOpen ? "open" : "collapsed"}`}>
          {renderSidebar(!desktopSidebarOpen, false)}
        </aside>

        {/* 2. Mobile Slide-out Drawer */}
        {mobileDrawerOpen && (
          <div className="admin-mobile-drawer-backdrop" onClick={() => setMobileDrawerOpen(false)}>
            <div
              className="admin-mobile-drawer-panel"
              onClick={(e) => e.stopPropagation()}
            >
              {renderSidebar(false, true)}
            </div>
          </div>
        )}

        {/* 3. Main Operations Content */}
        <main className="admin-content-area">
          {children}
        </main>
      </div>

      <style jsx global>{`
        .admin-root-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background-color: #f8fafc;
        }
        .admin-topbar {
          height: 60px;
          background-color: #0f172a;
          color: #ffffff;
          display: flex;
          align-items: center;
          justifyContent: space-between;
          padding: 0 1.75rem;
          position: sticky;
          top: 0;
          z-index: 50;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        .admin-topbar-link-hover:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          color: #ffffff !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }
        .admin-topbar-logout-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #f87171;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.38rem 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .admin-topbar-logout-btn:hover:not(:disabled) {
          background-color: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          border-color: rgba(239, 68, 68, 0.4);
        }
        .admin-topbar-logout-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .admin-topbar-menu-btn {
          display: flex;
          align-items: center;
          justifyContent: center;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #ffffff;
          cursor: pointer;
          padding: 0.35rem;
          border-radius: 6px;
          transition: all 0.15s ease;
        }
        .admin-topbar-menu-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        .admin-sidebar-close-btn:hover {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
        }
        .admin-layout-wrapper {
          display: flex;
          flex: 1;
          min-height: calc(100vh - 60px);
        }
        .admin-desktop-sidebar {
          width: 260px;
          min-width: 260px;
          flex-shrink: 0;
          background-color: #ffffff;
          border-right: 1px solid #e2e8f0;
          position: sticky;
          top: 60px;
          height: calc(100vh - 60px);
          overflow-y: auto;
          overflow-x: hidden;
          transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      min-width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .admin-desktop-sidebar.collapsed {
          width: 72px !important;
          min-width: 72px !important;
          max-width: 72px !important;
          border-right: 1px solid #e2e8f0 !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          transform: none !important;
        }
        .admin-desktop-sidebar.open {
          width: 260px;
          min-width: 260px;
          opacity: 1;
          transform: none;
        }
        .admin-sidebar-toggle-btn:hover {
          background-color: #e2e8f0 !important;
          color: #0f172a !important;
        }
        .admin-user-card-link:hover {
          background-color: #eff6ff !important;
          border-color: #bfdbfe !important;
          box-shadow: 0 1px 4px rgba(37, 99, 235, 0.08);
        }
        .admin-collapsed-user-avatar:hover {
          background-color: #1d4ed8 !important;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35) !important;
        }
        .admin-topbar-user:hover {
          background-color: rgba(255, 255, 255, 0.12) !important;
          border-color: rgba(255, 255, 255, 0.22) !important;
        }
        .admin-content-area {
          flex: 1;
          padding: 2rem 2.5rem;
          max-width: 1400px;
          min-width: 0;
        }
        .admin-mobile-drawer-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background-color: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
        }
        .admin-mobile-drawer-panel {
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          width: 280px;
          background-color: #ffffff;
          z-index: 1001;
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
        }
        @media (max-width: 1024px) {
          .admin-desktop-sidebar {
            display: none !important;
          }
          .admin-topbar-menu-btn {
            display: flex;
          }
          .admin-content-area {
            padding: 1.25rem 1rem;
          }
          .admin-topbar-user {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
