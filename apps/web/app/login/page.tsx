"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLoginMutation, useGetMeQuery } from "../../store/apis";
import { toast } from "../../components/Toast";
import {
  Shield,
  CheckCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
} from "../../components/Icons";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "";

  const [login, { isLoading }] = useLoginMutation();
  const { data: meData, refetch: refetchMe } = useGetMeQuery();
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (meData?.data) {
      if (meData.data.role === "ADMIN") {
        router.push("/admin");
      } else if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push("/services");
      }
    }
  }, [meData, router, redirectUrl]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    try {
      const response = await login(data).unwrap();
      if (response.success && response.data) {
        toast.success(`Welcome back, ${response.data.name}!`);
        await refetchMe();
        if (response.data.role === "ADMIN") {
          router.push("/admin");
        } else if (redirectUrl) {
          router.push(redirectUrl);
        } else {
          router.push("/services");
        }
      }
    } catch (err: any) {
      if (err?.status === 401) {
        setAuthError("Invalid email or password. Please try again.");
      } else if (err?.data?.message) {
        setAuthError(err.data.message);
      } else {
        setAuthError("Unable to connect to authentication server. Please try again.");
      }
    }
  };


  return (
    <div
      className="container"
      style={{
        maxWidth: "1040px",
        paddingTop: "2rem",
        paddingBottom: "3.5rem",
      }}
    >
      <div
        className="card auth-split-grid"
        style={{
          borderRadius: "20px",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "1fr 1.15fr",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)",
          backgroundColor: "#ffffff",
        }}
      >
        {/* LEFT: Premium Brand & Trust Showcase */}
        <div
          style={{
            background: "linear-gradient(150deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
            color: "#ffffff",
            padding: "3.5rem 2.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2.5rem" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #2563eb, #38bdf8)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "1.15rem",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
                }}
              >
                P
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "#ffffff", letterSpacing: "-0.02em" }}>
                  ProService
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "0.72rem",
                    color: "#94a3b8",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Enterprise Platform
                </span>
              </div>
            </div>

            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.3, marginBottom: "1rem", letterSpacing: "-0.02em" }}>
              Fast, Guaranteed Appointment Scheduling.
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "2.5rem" }}>
              Connect with certified service specialists. Every reservation is verified with zero double-booking and authoritative pricing.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#e2e8f0", fontSize: "0.9rem" }}>
                <CheckCircle size={18} style={{ color: "#38bdf8", flexShrink: 0 }} />
                <span>Zero Double-Booking Engine</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#e2e8f0", fontSize: "0.9rem" }}>
                <CheckCircle size={18} style={{ color: "#38bdf8", flexShrink: 0 }} />
                <span>Authoritative DB Price Protection</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#e2e8f0", fontSize: "0.9rem" }}>
                <Shield size={18} style={{ color: "#60a5fa", flexShrink: 0 }} />
                <span>Enterprise Data Isolation & RBAC</span>
              </div>
            </div>
          </div>

          <div style={{ paddingTop: "2rem", borderTop: "1px solid rgba(255, 255, 255, 0.1)", fontSize: "0.82rem", color: "#64748b" }}>
            &copy; {new Date().getFullYear()} ProService Systems Inc. All rights reserved.
          </div>
        </div>

        {/* RIGHT: High-Converting Auth Form */}
        <div style={{ padding: "3.5rem 3rem", backgroundColor: "#ffffff" }}>
          <div style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.35rem", letterSpacing: "-0.02em" }}>
              Welcome Back
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.92rem", margin: 0 }}>
              Sign in to manage your appointments and track services.
            </p>
          </div>


          {/* Error Banner */}
          {authError && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                padding: "0.85rem 1rem",
                borderRadius: "10px",
                marginBottom: "1.5rem",
                fontSize: "0.88rem",
              }}
              role="alert"
            >
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Email Field with Left Icon */}
              <div>
                <label className="form-label" htmlFor="login-email">Email Address</label>
                <div style={{ position: "relative" }}>
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
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    id="login-email"
                    className="form-input"
                    placeholder="name@example.com"
                    style={{ paddingLeft: "2.4rem" }}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <span className="form-error">{errors.email.message}</span>
                )}
              </div>

              {/* Password Field with Left Lock & Right Eye Toggle */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <label className="form-label" htmlFor="login-password" style={{ margin: 0 }}>Password</label>
                </div>
                <div style={{ position: "relative" }}>
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
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="login-password"
                    className="form-input"
                    placeholder="••••••••"
                    style={{ paddingLeft: "2.4rem", paddingRight: "3rem" }}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="auth-password-toggle"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="form-error">{errors.password.message}</span>
                )}
              </div>

              <button
                type="submit"
                id="login-submit-btn"
                disabled={isLoading}
                className="btn btn-primary btn-lg"
                style={{
                  width: "100%",
                  marginTop: "0.5rem",
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
                  fontWeight: 700,
                }}
              >
                {isLoading ? "Authenticating..." : "Sign In to Account"}
              </button>
            </div>
          </form>

          <div
            style={{
              marginTop: "2rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid #f1f5f9",
              textAlign: "center",
              fontSize: "0.88rem",
              color: "#64748b",
            }}
          >
            Don&apos;t have an account yet?{" "}
            <Link
              href="/register"
              id="goto-register-link"
              style={{
                color: "#2563eb",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-password-toggle {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justifyContent: center;
          cursor: pointer;
          color: #94a3b8;
          border-radius: 4px;
          transition: color 0.15s ease;
        }
        .auth-password-toggle:hover {
          color: #0f172a;
        }
        @media (max-width: 850px) {
          .auth-split-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container" style={{ textAlign: "center", padding: "4rem" }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
