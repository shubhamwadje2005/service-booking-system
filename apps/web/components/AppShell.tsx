"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    // Admin routes render in their own dedicated portal layout without customer Navbar or Footer
    return <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>{children}</div>;
  }

  return (
    <>
      <Navbar />
      <main style={{ flex: 1, padding: "2rem 0" }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
