"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAdminLoginMutation, useGetAdminMeQuery } from "../../../store/apis";
import { toast } from "../../../components/Toast";
import { Shield, Eye, EyeOff, Mail, Lock } from "../../../components/Icons";

const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Admin email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [adminLogin, { isLoading }] = useAdminLoginMutation();
  const { data: adminMeData, refetch: refetchAdminMe } = useGetAdminMeQuery();
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (adminMeData?.data?.role === "ADMIN") {
      router.push("/admin");
    }
  }, [adminMeData, router]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: AdminLoginFormData) => {
    setAuthError(null);
    try {
      const response = await adminLogin(data).unwrap();
      if (response.success && response.data) {
        toast.success("Admin logged in successfully!");
        router.replace("/admin");
      }
    } catch (err: any) {
      if (err?.status === 401) {
        setAuthError("Invalid admin credentials. Please check email and password.");
      } else if (err?.status === 403) {
        setAuthError("Access denied. This account does not have Admin privileges.");
      } else {
        setAuthError(err?.data?.message || "Failed to authenticate admin.");
      }
    }
  };

  return (
    <div className="container" style={{ maxWidth: "460px", paddingTop: "3rem", paddingBottom: "3rem" }}>
      <div
        className="card"
        style={{
          borderRadius: "16px",
          padding: "2.5rem",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "12px",
              backgroundColor: "#0f172a",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}
          >
            <Shield size={26} />
          </div>

          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            Admin Login
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.92rem", marginTop: "0.4rem" }}>
            Sign in to manage services, appointments, and dashboard statistics.
          </p>
        </div>


        {authError && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: "0.85rem 1rem",
              borderRadius: "8px",
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
            <div>
              <label className="form-label">Admin Email</label>
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
                  className="form-input"
                  placeholder="shubhamwadje2005@gmail.com"
                  style={{ paddingLeft: "2.4rem" }}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <span className="form-error">{errors.email.message}</span>
              )}
            </div>

            <div>
              <label className="form-label">Password</label>
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
              {isLoading ? "Signing in..." : "Login as Admin"}
            </button>
          </div>
        </form>

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
        `}</style>

        <div style={{ marginTop: "1.75rem", textAlign: "center", fontSize: "0.85rem", color: "#64748b" }}>
          Go to customer website?{" "}
          <Link href="/services" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
            Explore Services
          </Link>
        </div>
      </div>
    </div>
  );
}
