import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "../components/Toast";
import AppShell from "../components/AppShell";
import ReduxProvider from "../store/Provider";

export const metadata: Metadata = {
  title: "ProService — Enterprise On-Demand Service & Appointment Booking",
  description: "Certified professional services, real-time availability engine, authoritative DB pricing, and zero double-booking scheduling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <ReduxProvider>
          <Toaster />
          <AppShell>{children}</AppShell>
        </ReduxProvider>
      </body>
    </html>
  );
}
