"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useGetServicesQuery } from "../../store/apis";
import { Service } from "@repo/types";
import { Search, X, ChevronRight, Clock, ArrowRight, AlertTriangle, RefreshCw } from "../../components/Icons";
import { useDebounce } from "../../hooks/useDebounce";

// Curated high quality service fallback images based on keywords
const getFallbackImage = (name: string) => {
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
  if (lower.includes("pest") || lower.includes("sanitiz")) {
    return "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=800&q=80";
  }
  return "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80";
};

// Colocated Service Card
function ServiceCard({ service }: { service: Service }) {
  const [imgSrc, setImgSrc] = useState<string>(service.image || getFallbackImage(service.name));
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    setImgSrc(service.image || getFallbackImage(service.name));
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

        <div
          style={{
            position: "absolute",
            top: "0.75rem",
            right: "0.75rem",
            display: "flex",
            gap: "0.5rem",
          }}
        >
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
            <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>
              Starting rate
            </span>
            <span
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.01em",
              }}
            >
              ₹{Number(service.price).toFixed(0)}
            </span>
          </div>

          <Link
            href={`/services/${service.id}`}
            className="btn btn-secondary btn-sm"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontWeight: 600,
            }}
          >
            <span>View Details</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Colocated Service Cards Skeleton (Reference-matched: Thumb + Circle Avatar + Text Lines)
function ServiceCatalogSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
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
  );
}

export default function ServicesCatalogPage() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput.trim(), 300);
  const [selectedDuration, setSelectedDuration] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("default");

  const { data, isLoading, isError, refetch } = useGetServicesQuery({
    search: debouncedSearch || undefined,
  });

  const rawServices = data?.data || [];

  // Filter and sort client side
  const filteredServices = useMemo(() => {
    let result = rawServices.filter((s) => s.isActive);

    if (selectedDuration !== "ALL") {
      const maxMins = parseInt(selectedDuration, 10);
      if (maxMins === 30) {
        result = result.filter((s) => s.duration <= 30);
      } else if (maxMins === 60) {
        result = result.filter((s) => s.duration > 30 && s.duration <= 60);
      } else if (maxMins === 120) {
        result = result.filter((s) => s.duration > 60);
      }
    }

    if (sortBy === "price-asc") {
      result = [...result].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-desc") {
      result = [...result].sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "name") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Default: Newest first (latest added services at the top)
      result = [...result].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [rawServices, selectedDuration, sortBy]);

  return (
    <div className="container">
      {/* Breadcrumb */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.85rem",
          color: "#64748b",
          marginBottom: "1.5rem",
        }}
        aria-label="Breadcrumb"
      >
        <Link href="/" style={{ color: "#64748b", textDecoration: "none" }} className="nav-link-hover">
          Home
        </Link>
        <ChevronRight size={14} />
        <span style={{ color: "#0f172a", fontWeight: 600 }}>Services</span>
      </nav>

      {/* Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "1.5rem",
          marginBottom: "2rem",
          paddingBottom: "1.5rem",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
            <h1
              style={{
                fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Services Catalog
            </h1>
            {!isLoading && (
              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "9999px",
                  border: "1px solid #e2e8f0",
                }}
              >
                {filteredServices.length} {filteredServices.length === 1 ? "Service" : "Services"} Available
              </span>
            )}
          </div>
          <p style={{ color: "#64748b", fontSize: "1rem", margin: 0 }}>
            Find and schedule certified professional services with live slot availability.
          </p>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "2.5rem",
          backgroundColor: "#ffffff",
          padding: "1rem 1.25rem",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
        }}
      >
        {/* Search Input */}
        <div style={{ position: "relative", flex: 1, minWidth: "min(100%, 220px)" }}>
          <div
            style={{
              position: "absolute",
              left: "0.85rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <Search size={16} />
          </div>

          <input
            type="text"
            id="service-search-input"
            className="form-input"
            placeholder="Search services by name or description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              paddingLeft: "2.5rem",
              paddingRight: searchInput ? "2.5rem" : "0.85rem",
              height: "42px",
            }}
          />

          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "0.2rem",
                display: "flex",
              }}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Duration Filter Dropdown */}
        <div style={{ minWidth: "160px" }}>
          <select
            id="filter-duration-select"
            className="form-select"
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(e.target.value)}
            style={{ height: "42px" }}
          >
            <option value="ALL">All Durations</option>
            <option value="30">30 min or less</option>
            <option value="60">30 – 60 min</option>
            <option value="120">Over 60 min</option>
          </select>
        </div>

        {/* Sort By Dropdown */}
        <div style={{ minWidth: "160px" }}>
          <select
            id="sort-services-select"
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ height: "42px" }}
          >
            <option value="default">Sort: Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Alphabetical (A-Z)</option>
          </select>
        </div>

        {/* Clear Filters Reset */}
        {(searchInput || selectedDuration !== "ALL" || sortBy !== "default") && (
          <button
            onClick={() => {
              setSearchInput("");
              setSelectedDuration("ALL");
              setSortBy("default");
            }}
            className="btn btn-secondary btn-sm"
            style={{ height: "42px" }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Content States */}
      {isLoading && <ServiceCatalogSkeleton count={6} />}

      {isError && !isLoading && (
        <div
          style={{
            padding: "3rem 1.5rem",
            textAlign: "center",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #fee2e2",
            maxWidth: "520px",
            margin: "2rem auto",
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
            Unable to load services
          </h3>
          <p style={{ color: "#64748b", fontSize: "0.92rem", marginBottom: "1.5rem" }}>
            Could not retrieve the service catalog from the server. Please try again.
          </p>
          <button onClick={() => refetch()} className="btn btn-primary btn-sm">
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {!isLoading && !isError && filteredServices.length === 0 && (
        <div
          style={{
            padding: "4rem 1.5rem",
            textAlign: "center",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px dashed #cbd5e1",
            maxWidth: "540px",
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
            <Search size={24} />
          </div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
            {searchInput ? "No services match your search" : "No services available"}
          </h3>
          <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
            {searchInput
              ? `No active services matched "${searchInput}". Try adjusting your keywords or clearing the filters.`
              : "There are currently no active services in the catalog. Please check back later."}
          </p>
          <button
            onClick={searchInput ? () => setSearchInput("") : () => refetch()}
            className="btn btn-secondary btn-sm"
          >
            {searchInput ? "Clear Search" : "Refresh Services"}
          </button>
        </div>
      )}

      {!isLoading && !isError && filteredServices.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
            gap: "1.5rem",
          }}
        >
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}
