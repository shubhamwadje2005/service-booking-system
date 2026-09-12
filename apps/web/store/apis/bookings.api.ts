import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { APP_URL } from "../../config/env";
import {
  Booking,
  CreateBookingDto,
  ApiResponse,
} from "@repo/types";

export const bookingsApi = createApi({
  reducerPath: "bookingsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${APP_URL}/api/bookings`,
    credentials: "include",
  }),
  tagTypes: ["Bookings", "Booking"],
  endpoints: (builder) => ({
    createBooking: builder.mutation<ApiResponse<Booking>, CreateBookingDto>({
      query: (body) => ({
        url: "",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Bookings"],
    }),

    getMyBookings: builder.query<ApiResponse<Booking[]>, void>({
      query: () => "/my",
      providesTags: ["Bookings"],
    }),

    getBookingById: builder.query<ApiResponse<Booking>, string>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Booking", id }],
    }),

    cancelBooking: builder.mutation<ApiResponse<Booking>, string>({
      query: (id) => ({
        url: `/${id}/cancel`,
        method: "PATCH",
      }),
      invalidatesTags: (_result, _error, id) => [
        "Bookings",
        { type: "Booking", id },
      ],
    }),
  }),
});

export const {
  useCreateBookingMutation,
  useGetMyBookingsQuery,
  useGetBookingByIdQuery,
  useCancelBookingMutation,
} = bookingsApi;
