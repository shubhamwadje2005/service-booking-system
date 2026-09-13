"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useGetAdminServicesQuery,
  useGetAdminMeQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useUploadImageMutation,
} from "../../../store/apis";
import { Service, BookingStatus } from "@repo/types";
import { toast } from "../../../components/Toast";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Clock,
  AlertTriangle,
  RefreshCw,
  X,
  ExternalLink,
  Upload,
  ImageIcon,
} from "../../../components/Icons";

function formatTime12(time24: string): string {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr || "0", 10);
  const m = parseInt(mStr || "0", 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function addMinutesToTime(time24: string, minutes: number): string {
  const [hStr, mStr] = time24.split(":");
  const total = parseInt(hStr || "0", 10) * 60 + parseInt(mStr || "0", 10) + minutes;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function generateDefaultSlotStarts(durationMinutes: number): string[] {
  const dur = Number(durationMinutes);
  if (!dur || dur < 5 || isNaN(dur)) return [];
  const startMin = 9 * 60; // 09:00
  const endMin = 18 * 60; // 18:00
  const slots: string[] = [];
  let cur = startMin;

  while (cur + dur <= endMin) {
    const h = Math.floor(cur / 60);
    const m = cur % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    cur += dur;
  }
  return slots;
}

interface SlotManagerWidgetProps {
  slots: string[];
  onChangeSlots: (newSlots: string[]) => void;
  duration: number;
}

function SlotManagerWidget({ slots, onChangeSlots, duration }: SlotManagerWidgetProps) {
  const [morningTime, setMorningTime] = useState("09:30");
  const [afternoonTime, setAfternoonTime] = useState("13:00");
  const [eveningTime, setEveningTime] = useState("17:30");
  const [errorMessage, setErrorMessage] = useState("");

  const addSlot = (timeStr: string) => {
    setErrorMessage("");
    if (!timeStr || !timeStr.includes(":")) {
      setErrorMessage("Please enter a valid time");
      return;
    }
    if (slots.includes(timeStr)) {
      setErrorMessage(`Slot ${formatTime12(timeStr)} is already in the list`);
      return;
    }
    const updated = [...slots, timeStr].sort((a, b) => {
      const [hA, mA] = a.split(":").map(Number);
      const [hB, mB] = b.split(":").map(Number);
      return (hA! * 60 + mA!) - (hB! * 60 + mB!);
    });
    onChangeSlots(updated);
  };

  const handleRemoveSlot = (slotToRemove: string) => {
    onChangeSlots(slots.filter((s) => s !== slotToRemove));
  };

  const handleResetDefault = () => {
    onChangeSlots(generateDefaultSlotStarts(duration));
    setErrorMessage("");
  };

  const handleClearAll = () => {
    onChangeSlots([]);
    setErrorMessage("");
  };

  const morningSlots: string[] = [];
  const afternoonSlots: string[] = [];
  const eveningSlots: string[] = [];

  slots.forEach((s) => {
    const hour = parseInt(s.split(":")[0] || "0", 10);
    if (hour < 12) {
      morningSlots.push(s);
    } else if (hour < 17) {
      afternoonSlots.push(s);
    } else {
      eveningSlots.push(s);
    }
  });

  const renderSection = (
    title: string,
    groupSlots: string[],
    timeValue: string,
    setTimeValue: (val: string) => void
  ) => {
    return (
      <div style={{ marginBottom: "1.25rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.6rem",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <div
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "#64748b",
            }}
          >
            {title}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <input
              type="time"
              value={timeValue}
              onChange={(e) => {
                setTimeValue(e.target.value);
                setErrorMessage("");
              }}
              style={{
                padding: "0.25rem 0.5rem",
                fontSize: "0.8rem",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#0f172a",
              }}
            />
            <button
              type="button"
              onClick={() => addSlot(timeValue)}
              className="btn btn-secondary btn-sm"
              style={{
                padding: "0.25rem 0.6rem",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              + Add {title.charAt(0) + title.slice(1).toLowerCase()} Slot
            </button>
          </div>
        </div>

        {groupSlots.length === 0 ? (
          <div
            style={{
              padding: "0.85rem",
              textAlign: "center",
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
              border: "1px dashed #cbd5e1",
              color: "#94a3b8",
              fontSize: "0.82rem",
            }}
          >
            No {title.toLowerCase()} slots. Use "+ Add {title.charAt(0) + title.slice(1).toLowerCase()} Slot" above to add one.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(115px, 1fr))",
              gap: "0.65rem",
            }}
          >
            {groupSlots.map((time) => (
              <div
                key={time}
                style={{
                  position: "relative",
                  padding: "0.65rem 0.5rem",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.2rem",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleRemoveSlot(time)}
                  title={`Remove ${formatTime12(time)}`}
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "5px",
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "4px",
                    lineHeight: 1,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                >
                  <X size={13} />
                </button>
                <span style={{ fontWeight: 600, fontSize: "0.92rem", color: "#0f172a" }}>
                  {formatTime12(time)}
                </span>
                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                  {duration} min
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        padding: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          paddingBottom: "0.65rem",
          borderBottom: "1px solid #e2e8f0",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div>
          <strong style={{ fontSize: "0.92rem", color: "#0f172a" }}>
            Available Time Slots ({duration} mins)
          </strong>
          <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
            Total {slots.length} slots configured
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <button
            type="button"
            onClick={handleResetDefault}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: "0.75rem", padding: "0.25rem 0.55rem" }}
          >
            Reset Default ({duration}m)
          </button>
          {slots.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: "0.75rem", padding: "0.25rem 0.55rem", color: "#ef4444" }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            fontSize: "0.78rem",
            color: "#ef4444",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "6px",
            padding: "0.4rem 0.6rem",
            marginBottom: "0.75rem",
          }}
        >
          {errorMessage}
        </div>
      )}

      {renderSection("MORNING", morningSlots, morningTime, setMorningTime)}
      {renderSection("AFTERNOON", afternoonSlots, afternoonTime, setAfternoonTime)}
      {renderSection("EVENING", eveningSlots, eveningTime, setEveningTime)}
    </div>
  );
}

const serviceFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Service name must be at least 2 characters")
    .max(100, "Service name cannot exceed 100 characters"),
  description: z.string().trim().max(1000, "Description cannot exceed 1000 characters").optional(),
  price: z.coerce
    .number({ message: "Price must be a valid number" })
    .positive("Price must be greater than zero")
    .max(100000, "Price cannot exceed 100,000"),
  duration: z.coerce
    .number({ message: "Duration must be an integer" })
    .int("Duration must be in whole minutes")
    .positive("Duration must be greater than zero")
    .min(5, "Duration must be at least 5 minutes")
    .max(1440, "Duration cannot exceed 1440 minutes"),
  isActive: z.boolean().optional(),
  image: z.string().trim().optional(),
});

const SERVICE_IMAGE_PRESETS = [
  { label: "🧹 Deep Cleaning", url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80" },
  { label: "❄️ AC & Appliance", url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80" },
  { label: "🚰 Plumbing", url: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80" },
  { label: "⚡ Electrical", url: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80" },
  { label: "🎨 Painting", url: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80" },
  { label: "💇 Salon & Spa", url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80" },
  { label: "🚗 Car Care", url: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80" },
];

type ServiceFormData = z.infer<typeof serviceFormSchema>;

// Colocated Status Badge
function StatusBadge({ status }: { status: BookingStatus | string }) {
  const normalized = status.toUpperCase();

  let bg = "#f1f5f9";
  let color = "#475569";
  let border = "1px solid #e2e8f0";
  let dotColor = "#94a3b8";

  if (normalized === "ACTIVE") {
    bg = "#ecfdf5";
    color = "#047857";
    border = "1px solid #a7f3d0";
    dotColor = "#059669";
  } else if (normalized === "INACTIVE") {
    bg = "#f1f5f9";
    color = "#64748b";
    border = "1px solid #e2e8f0";
    dotColor = "#94a3b8";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.2rem 0.55rem",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 700,
        backgroundColor: bg,
        color,
        border,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: dotColor,
        }}
      />
      <span>{normalized}</span>
    </span>
  );
}

export default function AdminServicesPage() {
  const { data: adminData } = useGetAdminMeQuery();
  const currentUser = adminData?.data;
  const isAdmin = currentUser?.role === "ADMIN";

  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<string>("");

  const {
    data: servicesData,
    isLoading: isServicesLoading,
    isError,
    refetch,
  } = useGetAdminServicesQuery(
    {
      search: search.trim() || undefined,
      active: filterActive || undefined,
    },
    { skip: !isAdmin }
  );

  const [createService, { isLoading: isCreating }] = useCreateServiceMutation();
  const [updateService, { isLoading: isUpdating }] = useUpdateServiceMutation();
  const [deleteService, { isLoading: isDeleting }] = useDeleteServiceMutation();
  const [uploadImage] = useUploadImageMutation();

  const [isUploadingCreate, setIsUploadingCreate] = useState(false);
  const [isUploadingEdit, setIsUploadingEdit] = useState(false);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WEBP)");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    if (isEdit) setIsUploadingEdit(true);
    else setIsUploadingCreate(true);

    try {
      toast.info("Uploading image to Cloudinary...");
      const res = await uploadImage(formData).unwrap();
      if (res.success && res.data?.url) {
        if (isEdit) {
          editForm.setValue("image", res.data.url, { shouldValidate: true, shouldDirty: true });
        } else {
          createForm.setValue("image", res.data.url, { shouldValidate: true, shouldDirty: true });
        }
        toast.success("Image uploaded successfully!");
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to upload image. You can paste an image URL directly.");
    } finally {
      if (isEdit) setIsUploadingEdit(false);
      else setIsUploadingCreate(false);
      e.target.value = "";
    }
  };

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

  // Forms
  const createForm = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      price: 500,
      duration: 60,
      isActive: true,
      image: "",
    },
  });

  const editForm = useForm<ServiceFormData>({
    resolver: zodResolver(serviceFormSchema) as any,
  });

  const createDuration = Number(createForm.watch("duration")) || 60;
  const editDuration = Number(editForm.watch("duration")) || 60;

  const [createSlots, setCreateSlots] = useState<string[]>(() => generateDefaultSlotStarts(60));
  const [editSlots, setEditSlots] = useState<string[]>([]);

  const handleOpenEdit = (service: Service) => {
    editForm.reset({
      name: service.name,
      description: service.description || "",
      price: Number(service.price),
      duration: service.duration,
      isActive: service.isActive,
      image: service.image || "",
    });
    if (service.customSlots && Array.isArray(service.customSlots) && service.customSlots.length > 0) {
      setEditSlots(service.customSlots);
    } else {
      setEditSlots(generateDefaultSlotStarts(service.duration));
    }
    setEditingService(service);
  };

  const handleCreateSubmit = async (data: ServiceFormData) => {
    try {
      const res = await createService({
        name: data.name,
        description: data.description || undefined,
        price: data.price,
        duration: data.duration,
        isActive: data.isActive ?? true,
        image: data.image?.trim() || undefined,
        customSlots: createSlots.length > 0 ? createSlots : undefined,
      }).unwrap();

      if (res.success) {
        toast.success(`Service "${data.name}" created successfully!`);
        setIsCreateOpen(false);
        createForm.reset();
        refetch();
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create service.");
    }
  };

  const handleEditSubmit = async (data: ServiceFormData) => {
    if (!editingService) return;
    try {
      const res = await updateService({
        id: editingService.id,
        data: {
          name: data.name,
          description: data.description || undefined,
          price: data.price,
          duration: data.duration,
          isActive: data.isActive,
          image: data.image?.trim() || null,
          customSlots: editSlots.length > 0 ? editSlots : undefined,
        },
      }).unwrap();

      if (res.success) {
        toast.success(`Service "${data.name}" updated successfully!`);
        setEditingService(null);
        refetch();
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update service.");
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      const newStatus = !service.isActive;
      const res = await updateService({
        id: service.id,
        data: { isActive: newStatus },
      }).unwrap();

      if (res.success) {
        toast.success(
          newStatus
            ? `"${service.name}" is now active and bookable.`
            : `"${service.name}" is now deactivated.`
        );
        refetch();
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update service active status.");
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingService) return;
    try {
      const res = await deleteService(deletingService.id).unwrap();
      if (res.success) {
        toast.success(`Service "${deletingService.name}" deactivated successfully.`);
        setDeletingService(null);
        refetch();
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete service.");
    }
  };

  const servicesList = servicesData?.data || [];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "1.25rem",
          marginBottom: "2rem",
          paddingBottom: "1.5rem",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
              marginBottom: "0.35rem",
            }}
          >
            Service Catalog Management
          </h1>
          <p style={{ color: "#64748b", fontSize: "1rem", margin: 0 }}>
            Create, update pricing, configure durations, and control customer marketplace visibility.
          </p>
        </div>

        <button
          onClick={() => {
            createForm.reset({
              name: "",
              description: "",
              price: 500,
              duration: 60,
              isActive: true,
              image: "",
            });
            setCreateSlots(generateDefaultSlotStarts(60));
            setIsCreateOpen(true);
          }}
          className="btn btn-primary btn-md"
          style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}
        >
          <Plus size={18} />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          backgroundColor: "#ffffff",
          padding: "1rem 1.25rem",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          marginBottom: "1.75rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: "min(100%, 200px)" }}>
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
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search service name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: "2.4rem", height: "40px" }}
          />
        </div>

        <div style={{ minWidth: "160px" }}>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="form-select"
            style={{ height: "40px" }}
          >
            <option value="">All Services</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>

        {(search || filterActive) && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFilterActive("");
            }}
            className="btn btn-secondary btn-sm"
            style={{ height: "40px" }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Loading Skeleton Grid (Reference: Thumbnail + Avatar Circle + Text Lines) */}
      {isServicesLoading && (
        <div className="skeleton-grid" style={{ marginBottom: "2rem" }}>
          {Array.from({ length: 6 }).map((_, i) => (
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

      {/* Error State */}
      {isError && !isServicesLoading && (
        <div
          style={{
            padding: "3.5rem 1.5rem",
            textAlign: "center",
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #fee2e2",
            margin: "2rem auto",
            maxWidth: "520px",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              backgroundColor: "#fef2f2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}
          >
            <AlertTriangle size={26} />
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
            Unable to load services
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: "1.75rem" }}>
            Failed to retrieve administrative services from /api/admin/services.
          </p>
          <button onClick={() => refetch()} className="btn btn-primary btn-sm">
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isServicesLoading && !isError && servicesList.length === 0 && (
        <div
          style={{
            padding: "4rem 1.5rem",
            textAlign: "center",
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            border: "1px dashed #cbd5e1",
            maxWidth: "520px",
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
            <Search size={26} />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
            No services found
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
            {search || filterActive
              ? "No services match your active search filters."
              : "No services are currently configured in the database."}
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn btn-primary btn-md"
          >
            + Create First Service
          </button>
        </div>
      )}

      {/* Services Table */}
      {!isServicesLoading && !isError && servicesList.length > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Rate (₹)</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {servicesList.map((service) => (
                <tr key={service.id}>
                  <td>
                    <div>
                      <span style={{ fontWeight: 700, color: "#0f172a", display: "block" }}>
                        {service.name}
                      </span>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: "#64748b",
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          maxWidth: "300px",
                        }}
                      >
                        {service.description || "No description provided"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: "#0f172a", fontSize: "0.95rem" }}>
                      ₹{Number(service.price).toFixed(0)}
                    </strong>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#475569" }}>
                      <Clock size={14} />
                      <span>{service.duration} mins</span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={service.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td>
                    <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                      {new Date(service.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(service)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "0.35rem 0.6rem" }}
                        title="Edit Service"
                      >
                        <Edit2 size={14} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(service)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "0.35rem 0.6rem" }}
                        title={service.isActive ? "Deactivate Service" : "Activate Service"}
                      >
                        <span>{service.isActive ? "Deactivate" : "Activate"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingService(service)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: "0.35rem 0.5rem" }}
                        title="Delete Service"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Service Modal */}
      {isCreateOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            onClick={() => !isCreating && setIsCreateOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
            }}
          />
          <div
            style={{
              position: "relative",
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              width: "100%",
              maxWidth: "640px",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "1.75rem",
              zIndex: 1001,
            }}
            role="dialog"
            aria-modal="true"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Create New Service
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0, marginTop: "0.2rem" }}>
                  Add a professional service to the live database catalog.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isCreating && setIsCreateOpen(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <div>
                  <label className="form-label">Service Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Premium AC Repair"
                    className="form-input"
                    {...createForm.register("name")}
                  />
                  {createForm.formState.errors.name && (
                    <span className="form-error">{createForm.formState.errors.name.message}</span>
                  )}
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    placeholder="Describe what is included in this service..."
                    className="form-textarea"
                    rows={3}
                    {...createForm.register("description")}
                  />
                  {createForm.formState.errors.description && (
                    <span className="form-error">{createForm.formState.errors.description.message}</span>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label className="form-label">Rate (₹) *</label>
                    <input
                      type="number"
                      className="form-input"
                      step="1"
                      {...createForm.register("price")}
                    />
                    {createForm.formState.errors.price && (
                      <span className="form-error">{createForm.formState.errors.price.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Duration (Minutes) *</label>
                    <input
                      type="number"
                      className="form-input"
                      step="5"
                      {...createForm.register("duration")}
                    />
                    {createForm.formState.errors.duration && (
                      <span className="form-error">{createForm.formState.errors.duration.message}</span>
                    )}
                  </div>
                </div>

                {/* Service Image Section */}
                <div>
                  <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Service Photo / Image</span>
                    <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 400 }}>Optional</span>
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input
                        type="url"
                        placeholder="Paste image URL (https://...) or upload file"
                        className="form-input"
                        style={{ flex: 1 }}
                        {...createForm.register("image")}
                      />
                      <label
                        className="btn btn-secondary btn-md"
                        style={{
                          cursor: isUploadingCreate ? "not-allowed" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          whiteSpace: "nowrap",
                          padding: "0.55rem 0.85rem",
                        }}
                      >
                        <Upload size={14} />
                        <span>{isUploadingCreate ? "Uploading..." : "Upload Photo"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          disabled={isUploadingCreate}
                          onChange={(e) => handleUploadFile(e, false)}
                        />
                      </label>
                    </div>

                    {/* Quick Presets */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>Presets:</span>
                      {SERVICE_IMAGE_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => createForm.setValue("image", preset.url, { shouldDirty: true })}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "0.15rem 0.45rem", fontSize: "0.72rem" }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Image Preview */}
                    {createForm.watch("image") && (
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          height: "130px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          border: "1px solid #e2e8f0",
                          backgroundColor: "#f8fafc",
                        }}
                      >
                        <img
                          src={createForm.watch("image") || ""}
                          alt="Service Preview"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => createForm.setValue("image", "", { shouldDirty: true })}
                          style={{
                            position: "absolute",
                            top: "6px",
                            right: "6px",
                            backgroundColor: "rgba(15, 23, 42, 0.75)",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "4px",
                            padding: "0.2rem 0.5rem",
                            fontSize: "0.72rem",
                            cursor: "pointer",
                          }}
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Time Slot Manager (Morning, Afternoon, Evening + Custom Add) */}
                <SlotManagerWidget
                  slots={createSlots}
                  onChangeSlots={setCreateSlots}
                  duration={createDuration}
                />

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    id="create-service-active"
                    {...createForm.register("isActive")}
                    style={{ width: "16px", height: "16px" }}
                  />
                  <label htmlFor="create-service-active" style={{ fontSize: "0.9rem", color: "#0f172a", cursor: "pointer" }}>
                    Active immediately in public catalog
                  </label>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={isCreating}
                    className="btn btn-secondary btn-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="btn btn-primary btn-md"
                  >
                    {isCreating ? "Creating..." : "Create Service"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            onClick={() => !isUpdating && setEditingService(null)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
            }}
          />
          <div
            style={{
              position: "relative",
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              width: "100%",
              maxWidth: "640px",
              maxHeight: "92vh",
              overflowY: "auto",
              padding: "1.75rem",
              zIndex: 1001,
            }}
            role="dialog"
            aria-modal="true"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Edit Service
                </h3>
                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0, marginTop: "0.2rem" }}>
                  Updating: {editingService.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isUpdating && setEditingService(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={editForm.handleSubmit(handleEditSubmit)}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <div>
                  <label className="form-label">Service Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    {...editForm.register("name")}
                  />
                  {editForm.formState.errors.name && (
                    <span className="form-error">{editForm.formState.errors.name.message}</span>
                  )}
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    {...editForm.register("description")}
                  />
                  {editForm.formState.errors.description && (
                    <span className="form-error">{editForm.formState.errors.description.message}</span>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label className="form-label">Rate (₹) *</label>
                    <input
                      type="number"
                      className="form-input"
                      step="1"
                      {...editForm.register("price")}
                    />
                    {editForm.formState.errors.price && (
                      <span className="form-error">{editForm.formState.errors.price.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Duration (Minutes) *</label>
                    <input
                      type="number"
                      className="form-input"
                      step="5"
                      {...editForm.register("duration")}
                    />
                    {editForm.formState.errors.duration && (
                      <span className="form-error">{editForm.formState.errors.duration.message}</span>
                    )}
                  </div>
                </div>

                {/* Service Image Section */}
                <div>
                  <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Service Photo / Image</span>
                    <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 400 }}>Optional</span>
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input
                        type="url"
                        placeholder="Paste image URL (https://...) or upload file"
                        className="form-input"
                        style={{ flex: 1 }}
                        {...editForm.register("image")}
                      />
                      <label
                        className="btn btn-secondary btn-md"
                        style={{
                          cursor: isUploadingEdit ? "not-allowed" : "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          whiteSpace: "nowrap",
                          padding: "0.55rem 0.85rem",
                        }}
                      >
                        <Upload size={14} />
                        <span>{isUploadingEdit ? "Uploading..." : "Upload Photo"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          disabled={isUploadingEdit}
                          onChange={(e) => handleUploadFile(e, true)}
                        />
                      </label>
                    </div>

                    {/* Quick Presets */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>Presets:</span>
                      {SERVICE_IMAGE_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => editForm.setValue("image", preset.url, { shouldDirty: true })}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "0.15rem 0.45rem", fontSize: "0.72rem" }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Image Preview */}
                    {editForm.watch("image") && (
                      <div
                        style={{
                          position: "relative",
                          width: "100%",
                          height: "130px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          border: "1px solid #e2e8f0",
                          backgroundColor: "#f8fafc",
                        }}
                      >
                        <img
                          src={editForm.watch("image") || ""}
                          alt="Service Preview"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => editForm.setValue("image", "", { shouldDirty: true })}
                          style={{
                            position: "absolute",
                            top: "6px",
                            right: "6px",
                            backgroundColor: "rgba(15, 23, 42, 0.75)",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "4px",
                            padding: "0.2rem 0.5rem",
                            fontSize: "0.72rem",
                            cursor: "pointer",
                          }}
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Time Slot Manager (Morning, Afternoon, Evening + Custom Add) */}
                <SlotManagerWidget
                  slots={editSlots}
                  onChangeSlots={setEditSlots}
                  duration={editDuration}
                />

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    id="edit-service-active"
                    {...editForm.register("isActive")}
                    style={{ width: "16px", height: "16px" }}
                  />
                  <label htmlFor="edit-service-active" style={{ fontSize: "0.9rem", color: "#0f172a", cursor: "pointer" }}>
                    Service is active and bookable
                  </label>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setEditingService(null)}
                    disabled={isUpdating}
                    className="btn btn-secondary btn-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="btn btn-primary btn-md"
                  >
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Service Confirmation Modal */}
      {deletingService && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            onClick={() => !isDeleting && setDeletingService(null)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(4px)",
            }}
          />
          <div
            style={{
              position: "relative",
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              width: "100%",
              maxWidth: "460px",
              padding: "1.75rem",
              zIndex: 1001,
            }}
            role="dialog"
            aria-modal="true"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#fef2f2",
                    color: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertTriangle size={20} />
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  Delete Service
                </h3>
              </div>
              <button
                type="button"
                onClick={() => !isDeleting && setDeletingService(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "0.92rem", color: "#475569", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              Are you sure you want to delete <strong>{deletingService.name}</strong>?
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setDeletingService(null)}
                disabled={isDeleting}
                className="btn btn-secondary btn-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={isDeleting}
                className="btn btn-danger btn-md"
              >
                {isDeleting ? "Deleting..." : "Delete Service"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
