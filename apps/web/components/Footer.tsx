import React from "react";
import Link from "next/link";
import { Shield, CheckCircle } from "./Icons";

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "#ffffff",
        borderTop: "1px solid #e2e8f0",
        paddingTop: "3.5rem",
        paddingBottom: "2rem",
        marginTop: "auto",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "2.5rem",
            paddingBottom: "3rem",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          {/* Brand Col */}
          <div style={{ maxWidth: "320px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.85rem" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  backgroundColor: "#0f172a",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                }}
              >
                P
              </div>
              <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>
                ProService
              </span>
            </div>

            <p style={{ color: "#64748b", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
              Enterprise on-demand service appointment scheduling with guaranteed availability and conflict-free booking.
            </p>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                marginTop: "1.25rem",
                padding: "0.3rem 0.65rem",
                borderRadius: "9999px",
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#047857",
                fontSize: "0.78rem",
                fontWeight: 600,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#059669" }} />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4
              style={{
                fontSize: "0.82rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#0f172a",
                marginBottom: "1rem",
              }}
            >
              Platform
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <li>
                <Link href="/services" style={{ color: "#64748b", fontSize: "0.9rem", textDecoration: "none" }} className="footer-link">
                  Services Marketplace
                </Link>
              </li>
              <li>
                <Link href="/bookings" style={{ color: "#64748b", fontSize: "0.9rem", textDecoration: "none" }} className="footer-link">
                  My Bookings
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" style={{ color: "#64748b", fontSize: "0.9rem", textDecoration: "none" }} className="footer-link">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/#why-us" style={{ color: "#64748b", fontSize: "0.9rem", textDecoration: "none" }} className="footer-link">
                  Platform Guarantees
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Account Links */}
          <div>
            <h4
              style={{
                fontSize: "0.82rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#0f172a",
                marginBottom: "1rem",
              }}
            >
              Customer Account
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <li>
                <Link href="/login" style={{ color: "#64748b", fontSize: "0.9rem", textDecoration: "none" }} className="footer-link">
                  Customer Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" style={{ color: "#64748b", fontSize: "0.9rem", textDecoration: "none" }} className="footer-link">
                  Create Account
                </Link>
              </li>
              <li>
                <Link href="/profile" style={{ color: "#64748b", fontSize: "0.9rem", textDecoration: "none" }} className="footer-link">
                  Account Settings
                </Link>
              </li>
              <li>
                <Link href="/bookings" style={{ color: "#64748b", fontSize: "0.9rem", textDecoration: "none" }} className="footer-link">
                  Booking History
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust Guarantees */}
          <div>
            <h4
              style={{
                fontSize: "0.82rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#0f172a",
                marginBottom: "1rem",
              }}
            >
              Enterprise Standards
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#475569" }}>
                <CheckCircle size={15} style={{ color: "#059669", flexShrink: 0 }} />
                <span>Authoritative DB Pricing</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#475569" }}>
                <CheckCircle size={15} style={{ color: "#059669", flexShrink: 0 }} />
                <span>Zero Double-Booking Engine</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#475569" }}>
                <CheckCircle size={15} style={{ color: "#059669", flexShrink: 0 }} />
                <span>HTTP 409 Conflict Prevention</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#475569" }}>
                <Shield size={15} style={{ color: "#2563eb", flexShrink: 0 }} />
                <span>Role-Based Data Security</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div
          style={{
            paddingTop: "1.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            fontSize: "0.82rem",
            color: "#64748b",
          }}
        >
          <div>
            &copy; {new Date().getFullYear()} ProService Systems Inc. All rights reserved.
          </div>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <span>PostgreSQL & Drizzle ORM</span>
            <span>Next.js App Router</span>
            <span>TypeScript Enterprise</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
