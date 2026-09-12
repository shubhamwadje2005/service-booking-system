"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegisterMutation, useGetMeQuery } from "../../store/apis";
import { toast } from "../../components/Toast";
import {
  Shield,
  CheckCircle,
  ArrowRight,
  Eye,
  EyeOff,
  User as UserIcon,
  Mail,
  Lock,
} from "../../components/Icons";

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),
    email: z
      .string()
      .trim()
      .min(1, "Email address is required")
      .email("Please provide a valid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password cannot exceed 100 characters"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [registerUser, { isLoading }] = useRegisterMutation();
  const { refetch: refetchMe } = useGetMeQuery();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setErrorMessage(null);
    try {
      const response = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      }).unwrap();

      if (response.success) {
        toast.success("Account created successfully! Welcome to ProService.");
        await refetchMe();
        router.push("/services");
      }
    } catch (err: any) {
      if (err?.status === 409) {
        setErrorMessage("An account with this email address already exists. Please sign in instead.");
      } else if (err?.data?.message) {
        setErrorMessage(err.data.message);
      } else {
        setErrorMessage("Registration failed due to a server error. Please try again later.");
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
        {/* LEFT: Premium Brand & Value Proposition */}
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
              Join Thousands of Satisfied Customers.
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "2.5rem" }}>
              Create your free account to unlock certified professional appointments, guaranteed slot availability, and zero hidden fees.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#e2e8f0", fontSize: "0.9rem" }}>
                <CheckCircle size={18} style={{ color: "#38bdf8", flexShrink: 0 }} />
                <span>Instant Guaranteed Appointment Booking</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#e2e8f0", fontSize: "0.9rem" }}>
                <CheckCircle size={18} style={{ color: "#38bdf8", flexShrink: 0 }} />
                <span>Transparent DB-Certified Pricing</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#e2e8f0", fontSize: "0.9rem" }}>
                <Shield size={18} style={{ color: "#60a5fa", flexShrink: 0 }} />
                <span>Zero Duplicate Conflict Engine</span>
              </div>
            </div>
          </div>

          <div style={{ paddingTop: "2rem", borderTop: "1px solid rgba(255, 255, 255, 0.1)", fontSize: "0.82rem", color: "#64748b" }}>
            By registering you agree to our Terms of Service & Privacy Policy.
          </div>
        </div>

        {/* RIGHT: Registration Form */}
        <div style={{ padding: "3.5rem 3rem", backgroundColor: "#ffffff" }}>
          <div style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.35rem", letterSpacing: "-0.02em" }}>
              Create Your Account
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.92rem", margin: 0 }}>
              Enter your information below to get started immediately.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                padding: "0.85rem 1rem",
                borderRadius: "10px",
                marginBottom: "1.5rem",
                fontSize: "0.88rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
              role="alert"
            >
              <div>{errorMessage}</div>
              {errorMessage.includes("already exists") && (
                <Link
                  href="/login"
                  style={{ color: "#2563eb", fontWeight: 700, textDecoration: "none", fontSize: "0.85rem" }}
                >
                  Click here to sign in &rarr;
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Full Name with Left User Icon */}
              <div>
                <label className="form-label" htmlFor="register-name">Full Name</label>
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
                    <UserIcon size={16} />
                  </div>
                  <input
                    type="text"
                    id="register-name"
                    className="form-input"
                    placeholder="e.g. John Doe"
                    style={{ paddingLeft: "2.4rem" }}
                    {...register("name")}
                  />
                </div>
                {errors.name && (
                  <span className="form-error">{errors.name.message}</span>
                )}
              </div>

              {/* Email with Left Mail Icon */}
              <div>
                <label className="form-label" htmlFor="register-email">Email Address</label>
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
                    id="register-email"
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

              {/* Password with Left Lock & Right Eye Toggle */}
              <div>
                <label className="form-label" htmlFor="register-password">Password</label>
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
                    id="register-password"
                    className="form-input"
                    placeholder="At least 6 characters"
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

              {/* Confirm Password with Left Lock & Right Eye Toggle */}
              <div>
                <label className="form-label" htmlFor="register-confirm-password">Confirm Password</label>
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
                    type={showConfirmPassword ? "text" : "password"}
                    id="register-confirm-password"
                    className="form-input"
                    placeholder="Re-enter your password"
                    style={{ paddingLeft: "2.4rem", paddingRight: "3rem" }}
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="auth-password-toggle"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="form-error">{errors.confirmPassword.message}</span>
                )}
              </div>

              <button
                type="submit"
                id="register-submit-btn"
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
                {isLoading ? "Creating Account..." : "Create Free Account"}
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
            Already have an account?{" "}
            <Link
              href="/login"
              id="goto-login-link"
              style={{
                color: "#2563eb",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Sign In
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
