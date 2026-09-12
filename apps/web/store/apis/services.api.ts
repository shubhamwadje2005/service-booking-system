import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { APP_URL } from "../../config/env";
import {
  Service,
  ApiResponse,
  AvailabilityResponse,
} from "@repo/types";

export const servicesApi = createApi({
  reducerPath: "servicesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${APP_URL}/api/services`,
    credentials: "include",
  }),
  tagTypes: ["Services", "Service", "Availability"],
  endpoints: (builder) => ({
    getServices: builder.query<ApiResponse<Service[]>, { search?: string } | void>({
      query: (params) => {
        const search = params?.search ? encodeURIComponent(params.search) : "";
        return `/${search ? `?search=${search}` : ""}`;
      },
      providesTags: ["Services"],
    }),

    getServiceById: builder.query<ApiResponse<Service>, string>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Service", id }],
    }),

    getServiceAvailability: builder.query<
      ApiResponse<AvailabilityResponse>,
      { serviceId: string; date: string }
    >({
      query: ({ serviceId, date }) =>
        `/${serviceId}/availability?date=${encodeURIComponent(date)}`,
      providesTags: ["Availability"],
    }),
  }),
});

export const {
  useGetServicesQuery,
  useGetServiceByIdQuery,
  useGetServiceAvailabilityQuery,
} = servicesApi;
