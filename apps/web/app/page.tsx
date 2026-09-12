"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useGetServicesQuery, useGetMeQuery } from "../store/apis";
import { Service } from "@repo/types";
import {
  Shield,
  Calendar,
  Clock,
  CheckCircle,
  ArrowRight,
  Sparkles,
  DollarSign,
  User,
  Star,
  AlertTriangle,
  RefreshCw,
} from "../components/Icons";

const getLandingFallbackImage = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("clean") || lower.includes("house")) {
    return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80";
  }
  if (lower.includes("repair") || lower.includes("ac") || lower.includes("electric")) {
    return "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80";
  }
  if (lower.includes("plumb") || lower.includes("pipe")) {
    return "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80";
  }
  if (lower.includes("paint") || lower.includes("decor")) {
    return "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80";
  }
  return "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80";
};

// Colocated Service Card for Landing Page
function LandingServiceCard({ service }: { service: Service }) {
  const [imgSrc, setImgSrc] = useState(service.image || getLandingFallbackImage(service.name));
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    setImgSrc(service.image || getLandingFallbackImage(service.name));
    setHasError(false);
  }, [service.image, service.name]);

  return (
    <div
      className="card service-card"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "180px",
          backgroundColor: "#f1f5f9",
          overflow: "hidden",
        }}
      >
        <img
          src={imgSrc}
          alt={service.name}
          onError={() => {
            if (!hasError) {
              setHasError(true);
              setImgSrc("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80");
            }
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.3s ease",
          }}
          className="service-card-image"
          loading="lazy"
        />
        <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem" }}>
          <span
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(4px)",
              color: "#ffffff",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.25rem 0.6rem",
              borderRadius: "9999px",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <Clock size={12} />
            <span>{service.duration} min</span>
          </span>
        </div>
      </div>

      <div
        style={{
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: "0.75rem",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "#0f172a",
              lineHeight: 1.3,
              marginBottom: "0.35rem",
            }}
          >
            {service.name}
          </h3>
          <p
            style={{
              fontSize: "0.88rem",
              color: "#64748b",
              lineHeight: 1.5,
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {service.description || "Certified service provided by verified professionals with guaranteed satisfaction."}
          </p>
        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: "1rem",
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Starting rate</span>
            <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
              ₹{Number(service.price).toFixed(0)}
            </span>
          </div>
          <Link
            href={`/services/${service.id}`}
            className="btn btn-secondary btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontWeight: 600 }}
          >
            <span>View Details</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { data: meData } = useGetMeQuery();
  const { data: servicesData, isLoading, isError, refetch } = useGetServicesQuery();

  const currentUser = meData?.data;
  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role === "ADMIN";

  // Display top 3 or 4 services from real backend data
  const services = servicesData?.data?.filter((s) => s.isActive)?.slice(0, 4) || [];

  return (
    <div className="container" style={{ display: "flex", flexDirection: "column", gap: "5rem" }}>
      {/* 1. HERO SECTION */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          alignItems: "center",
          gap: "3.5rem",
          paddingTop: "2rem",
          paddingBottom: "1.5rem",
        }}
      >
        {/* Left: Messaging & CTAs */}
        <div style={{ maxWidth: "600px" }}>
          {/* Eyebrow */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.35rem 0.85rem",
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "9999px",
              color: "#1d4ed8",
              fontSize: "0.82rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "1.25rem",
            }}
          >
            <Sparkles size={14} />
            <span>Professional Service Booking</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2.25rem, 4.5vw, 3.4rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "#0f172a",
              marginBottom: "1.25rem",
            }}
          >
            Book Professional Services Without The Hassle
          </h1>

          <p
            style={{
              fontSize: "1.1rem",
              color: "#475569",
              lineHeight: 1.65,
              marginBottom: "2rem",
            }}
          >
            Discover verified professional services, choose authoritative time slots with real-time collision detection, and manage your appointments seamlessly from one enterprise platform.
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/services"
              className="btn btn-primary btn-lg"
              id="hero-explore-services"
            >
              <span>Explore Services</span>
              <ArrowRight size={16} />
            </Link>

            <a
              href="#how-it-works"
              className="btn btn-secondary btn-lg"
              id="hero-how-it-works"
            >
              How It Works
            </a>
          </div>

          {/* Social Proof Mini */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
              marginTop: "2.5rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#eab308" }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={16} fill="#eab308" />
              ))}
            </div>
            <span style={{ fontSize: "0.88rem", color: "#64748b", fontWeight: 500 }}>
              Guaranteed slots & zero double-booking architecture
            </span>
          </div>
        </div>

        {/* Right: Interactive Product Composition Preview */}
        <div>
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "1.5rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
              position: "relative",
            }}
          >
            {/* Header chip */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "1rem",
                marginBottom: "1rem",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#10b981" }} />
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>
                  Live Booking Preview
                </span>
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "9999px",
                  fontWeight: 600,
                }}
              >
                Instant Confirmation
              </span>
            </div>

            {/* Mock Service Card inside preview */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                    {(servicesData?.data?.find((s) => s.isActive && !s.name.toLowerCase().includes("test"))?.name) || "Professional Home Deep Cleaning"}
                  </h4>
                  <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0.2rem 0 0" }}>
                    Duration: {(servicesData?.data?.find((s) => s.isActive && !s.name.toLowerCase().includes("test"))?.duration) || 120} mins • Certified Specialist
                  </p>
                </div>
                <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                  ₹{(servicesData?.data?.find((s) => s.isActive && !s.name.toLowerCase().includes("test"))?.price) ? Number(servicesData.data.find((s) => s.isActive && !s.name.toLowerCase().includes("test"))!.price).toFixed(0) : "1200"}
                </span>
              </div>
            </div>

            {/* Mock Time Slots Grid */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b", marginBottom: "0.5rem" }}>
                AVAILABLE TIME SLOTS
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                <div
                  style={{
                    padding: "0.5rem",
                    borderRadius: "6px",
                    border: "2px solid #2563eb",
                    backgroundColor: "#eff6ff",
                    color: "#1d4ed8",
                    textAlign: "center",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                  }}
                >
                  10:00 AM
                </div>
                <div
                  style={{
                    padding: "0.5rem",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#ffffff",
                    color: "#0f172a",
                    textAlign: "center",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                  }}
                >
                  11:00 AM
                </div>
                <div
                  style={{
                    padding: "0.5rem",
                    borderRadius: "6px",
                    border: "1px solid #f1f5f9",
                    backgroundColor: "#f8fafc",
                    color: "#94a3b8",
                    textAlign: "center",
                    fontSize: "0.82rem",
                  }}
                >
                  02:00 PM (Booked)
                </div>
              </div>
            </div>

            {/* Mock Confirmation CTA */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1rem",
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#047857", fontSize: "0.85rem", fontWeight: 600 }}>
                <CheckCircle size={16} />
                <span>Slot Reserved (Zero Collision)</span>
              </div>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#047857" }}>
                Ready to Confirm
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST ASSURANCE BAR */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.5rem",
          padding: "2rem",
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
          <div style={{ padding: "0.5rem", borderRadius: "8px", backgroundColor: "#eff6ff", color: "#2563eb" }}>
            <Shield size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>Zero Double-Booking</div>
            <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.2rem" }}>
              Authoritative conflict engine validates slot availability.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
          <div style={{ padding: "0.5rem", borderRadius: "8px", backgroundColor: "#ecfdf5", color: "#059669" }}>
            <DollarSign size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>Guaranteed Rates</div>
            <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.2rem" }}>
              Backend validated pricing with no hidden charges.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
          <div style={{ padding: "0.5rem", borderRadius: "8px", backgroundColor: "#fffbeb", color: "#d97706" }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>Instant Confirmation</div>
            <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.2rem" }}>
              Immediate booking creation with tracking timeline.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
          <div style={{ padding: "0.5rem", borderRadius: "8px", backgroundColor: "#f1f5f9", color: "#475569" }}>
            <User size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>Certified Specialists</div>
            <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.2rem" }}>
              Pre-screened professionals dedicated to quality work.
            </div>
          </div>
        </div>
      </section>

      {/* 3. POPULAR SERVICES SECTION */}
      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "2rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.25rem" }}>
              Available Catalog
            </div>
            <h2 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
              Popular Professional Services
            </h2>
          </div>
          <Link href="/services" className="btn btn-secondary btn-sm">
            <span>View All Services</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading && (
          <div className="skeleton-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-thumb" />
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

        {isError && !isLoading && (
          <div
            style={{
              padding: "3rem 1.5rem",
              textAlign: "center",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #fee2e2",
              maxWidth: "520px",
              margin: "1rem auto",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#fef2f2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
              Failed to load service catalog
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.92rem", marginBottom: "1.5rem" }}>
              We could not connect to the service catalog. Please check your connection and retry.
            </p>
            <button onClick={() => refetch()} className="btn btn-primary btn-sm">
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>
          </div>
        )}

        {!isLoading && !isError && services.length === 0 && (
          <div className="card" style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            No active services currently listed in the system.
          </div>
        )}

        {!isLoading && !isError && services.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {services.map((service) => (
              <LandingServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </section>

      {/* 4. HOW BOOKING WORKS */}
      <section id="how-it-works" style={{ paddingTop: "1rem" }}>
        <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto 3rem auto" }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>
            Seamless Process
          </div>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
            How Appointment Booking Works
          </h2>
          <p style={{ color: "#64748b", fontSize: "1rem", marginTop: "0.5rem" }}>
            Get your appointments scheduled in three straightforward steps.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "2rem",
          }}
        >
          {/* Step 1 */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "2rem",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "1.1rem",
                marginBottom: "1.25rem",
              }}
            >
              1
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
              Select a Certified Service
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.92rem", lineHeight: 1.6, margin: 0 }}>
              Browse our catalog of verified home and technical services with clear, transparent pricing and fixed appointment durations.
            </p>
          </div>

          {/* Step 2 */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "2rem",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "1.1rem",
                marginBottom: "1.25rem",
              }}
            >
              2
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
              Pick Date & Time Slot
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.92rem", lineHeight: 1.6, margin: 0 }}>
              Choose any operating date and pick an available time slot calculated dynamically by our collision prevention engine.
            </p>
          </div>

          {/* Step 3 */}
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "2rem",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                backgroundColor: "#059669",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "1.1rem",
                marginBottom: "1.25rem",
              }}
            >
              3
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
              Instant Confirmation
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.92rem", lineHeight: 1.6, margin: 0 }}>
              Receive an authoritative booking reference immediately. Track appointment status from Pending to Confirmed to Completed.
            </p>
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE US / TRUST SECTION */}
      <section id="why-us">
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "3.5rem 2.5rem",
          }}
        >
          <div style={{ maxWidth: "600px", marginBottom: "2.5rem" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.35rem" }}>
              Enterprise Reliability
            </div>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
              Engineered For Complete Peace of Mind
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "2rem",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#0f172a", marginBottom: "0.4rem" }}>
                Zero Double-Booking Guarantee
              </div>
              <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                Our backend availability engine performs ACID-compliant collision checks so no two customers can ever reserve the same slot.
              </p>
            </div>

            <div>
              <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#0f172a", marginBottom: "0.4rem" }}>
                Authoritative Pricing
              </div>
              <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                Prices are fetched directly from our PostgreSQL database records, ensuring zero price discrepancies or hidden service fees.
              </p>
            </div>

            <div>
              <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "#0f172a", marginBottom: "0.4rem" }}>
                Transparent Status Tracking
              </div>
              <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                Stay informed with clean 4-stage timelines covering Pending, Confirmed, Completed, and graceful cancellation states.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION SECTION */}
      <section
        style={{
          backgroundColor: "#0f172a",
          borderRadius: "16px",
          padding: "3.5rem 2rem",
          textAlign: "center",
          color: "#ffffff",
        }}
      >
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "1rem" }}>
            Ready to Schedule Your Appointment?
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "2rem" }}>
            Explore available professional services, check real-time slots, and book in less than 60 seconds.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/services" className="btn btn-accent btn-lg">
              <span>Browse Services Catalog</span>
              <ArrowRight size={16} />
            </Link>
            {!isAuthenticated && (
              <Link
                href="/register"
                className="btn btn-secondary btn-lg"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", color: "#ffffff", borderColor: "rgba(255, 255, 255, 0.2)" }}
              >
                Create Free Account
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
