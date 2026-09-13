import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { APP_URL } from "../../config/env";
import { bookingsApi } from "./bookings.api";
import { servicesApi } from "./services.api";
import {
  Service,
  CreateServiceDto,
  UpdateServiceDto,
  Booking,
  BookingStatus,
  DashboardStats,
  AdminBookingsQueryParams,
  PaginatedResponse,
  ApiResponse,
} from "@repo/types";

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${APP_URL}/api/admin`,
    credentials: "include",
  }),
  tagTypes: ["AdminStats", "AdminServices", "AdminBookings", "AdminBooking"],
  endpoints: (builder) => ({
    getAdminDashboardStats: builder.query<ApiResponse<DashboardStats>, void>({
      query: () => "/dashboard/stats",
      providesTags: ["AdminStats"],
    }),

    getAdminServices: builder.query<
      ApiResponse<Service[]>,
      { search?: string; active?: string } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.set("search", params.search);
        if (params?.active) searchParams.set("active", params.active);
        const qs = searchParams.toString();
        return `/services${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["AdminServices"],
    }),

    createService: builder.mutation<ApiResponse<Service>, CreateServiceDto>({
      query: (body) => ({
        url: "/services",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AdminServices", "AdminStats"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(servicesApi.util.invalidateTags(["Services", "Service"]));
        } catch {}
      },
    }),

    updateService: builder.mutation<
      ApiResponse<Service>,
      { id: string; data: UpdateServiceDto }
    >({
      query: ({ id, data }) => ({
        url: `/services/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "AdminServices",
        "AdminStats",
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(servicesApi.util.invalidateTags(["Services", "Service"]));
        } catch {}
      },
    }),

    deleteService: builder.mutation<ApiResponse<Service>, string>({
      query: (id) => ({
        url: `/services/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminServices", "AdminStats"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(servicesApi.util.invalidateTags(["Services", "Service"]));
        } catch {}
      },
    }),

    getAdminBookings: builder.query<
      ApiResponse<PaginatedResponse<Booking>>,
      AdminBookingsQueryParams | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.set("page", String(params.page));
        if (params?.limit) searchParams.set("limit", String(params.limit));
        if (params?.status) searchParams.set("status", params.status);
        if (params?.date) searchParams.set("date", params.date);
        if (params?.serviceId) searchParams.set("serviceId", params.serviceId);
        if (params?.search) searchParams.set("search", params.search);
        const qs = searchParams.toString();
        return `/bookings${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["AdminBookings"],
    }),

    getAdminBookingById: builder.query<ApiResponse<Booking>, string>({
      query: (id) => `/bookings/${id}`,
      providesTags: (_result, _error, id) => [{ type: "AdminBooking", id }],
    }),

    updateAdminBookingStatus: builder.mutation<
      ApiResponse<Booking>,
      { id: string; status: BookingStatus }
    >({
      query: ({ id, status }) => ({
        url: `/bookings/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "AdminBookings",
        { type: "AdminBooking", id },
        "AdminStats",
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(bookingsApi.util.invalidateTags(["Bookings", "Booking"]));
        } catch {}
      },
    }),

    uploadImage: builder.mutation<ApiResponse<{ url: string }>, FormData>({
      query: (formData) => ({
        url: "/upload",
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

export const {
  useGetAdminDashboardStatsQuery,
  useGetAdminServicesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useGetAdminBookingsQuery,
  useGetAdminBookingByIdQuery,
  useUpdateAdminBookingStatusMutation,
  useUploadImageMutation,
} = adminApi;
