import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { APP_URL } from "../../config/env";
import {
  LOGIN_REQUEST,
  LOGIN_RESPONSE,
  LOGOUT_REQUEST,
  LOGOUT_RESPONSE,
  ME_REQUEST,
  ME_RESPONSE,
  REGISTER_REQUEST,
  REGISTER_RESPONSE,
  User,
  ApiResponse,
} from "@repo/types";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${APP_URL}/api/auth`,
    credentials: "include",
  }),
  tagTypes: ["Auth", "AdminAuth"],
  endpoints: (builder) => ({
    signin: builder.mutation<LOGIN_RESPONSE, LOGIN_REQUEST>({
      query: (userdata) => ({
        url: "/login",
        method: "POST",
        body: userdata,
      }),
      invalidatesTags: ["Auth"],
    }),

    login: builder.mutation<LOGIN_RESPONSE, LOGIN_REQUEST>({
      query: (userdata) => ({
        url: "/login",
        method: "POST",
        body: userdata,
      }),
      invalidatesTags: ["Auth", "AdminAuth"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.data) {
            dispatch(
              authApi.util.updateQueryData("getMe", undefined, () => ({
                success: true,
                message: "Authenticated",
                data: data.data,
              }))
            );
            if (data.data.role === "ADMIN") {
              dispatch(
                authApi.util.updateQueryData("getAdminMe", undefined, () => ({
                  success: true,
                  message: "Admin authenticated",
                  data: data.data,
                }))
              );
            }
          }
        } catch { }
      },
    }),

    signup: builder.mutation<REGISTER_RESPONSE, REGISTER_REQUEST>({
      query: (userdata) => ({
        url: "/register",
        method: "POST",
        body: userdata,
      }),
      invalidatesTags: ["Auth"],
    }),

    register: builder.mutation<REGISTER_RESPONSE, REGISTER_REQUEST>({
      query: (userdata) => ({
        url: "/register",
        method: "POST",
        body: userdata,
      }),
      invalidatesTags: ["Auth"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.data) {
            dispatch(
              authApi.util.updateQueryData("getMe", undefined, () => ({
                success: true,
                message: "Authenticated",
                data: data.data,
              }))
            );
          }
        } catch { }
      },
    }),

    signout: builder.mutation<LOGOUT_RESPONSE, LOGOUT_REQUEST>({
      query: () => ({
        url: "/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),

    logout: builder.mutation<LOGOUT_RESPONSE, LOGOUT_REQUEST | void>({
      query: () => ({
        url: "/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth", "AdminAuth"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            authApi.util.updateQueryData("getMe", undefined, () => ({
              success: false,
              message: "Logged out",
              data: undefined,
            }))
          );
          dispatch(
            authApi.util.updateQueryData("getAdminMe", undefined, () => ({
              success: false,
              message: "Admin logged out",
              data: undefined,
            }))
          );
        } catch {
          // ignore
        }
      },
    }),

    getMe: builder.query<ME_RESPONSE, ME_REQUEST | void>({
      query: () => "/me",
      providesTags: ["Auth"],
    }),

    adminLogin: builder.mutation<LOGIN_RESPONSE, LOGIN_REQUEST>({
      query: (userdata) => ({
        url: "/admin/login",
        method: "POST",
        body: userdata,
      }),
      invalidatesTags: ["AdminAuth", "Auth"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.data) {
            dispatch(
              authApi.util.updateQueryData("getAdminMe", undefined, () => ({
                success: true,
                message: "Admin authenticated",
                data: data.data,
              }))
            );
            dispatch(
              authApi.util.updateQueryData("getMe", undefined, () => ({
                success: true,
                message: "Admin authenticated",
                data: data.data,
              }))
            );
          }
        } catch { }
      },
    }),

    adminLogout: builder.mutation<LOGOUT_RESPONSE, LOGOUT_REQUEST | void>({
      query: () => ({
        url: "/admin/logout",
        method: "POST",
      }),
      invalidatesTags: ["AdminAuth", "Auth"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            authApi.util.updateQueryData("getAdminMe", undefined, () => ({
              success: false,
              message: "Admin logged out",
              data: undefined,
            }))
          );
          dispatch(
            authApi.util.updateQueryData("getMe", undefined, () => ({
              success: false,
              message: "Admin logged out",
              data: undefined,
            }))
          );
        } catch {
          // ignore
        }
      },
    }),

    getAdminMe: builder.query<ME_RESPONSE, ME_REQUEST | void>({
      query: () => "/admin/me",
      providesTags: ["AdminAuth"],
    }),
  }),
});

export const {
  useSigninMutation,
  useLoginMutation,
  useSignupMutation,
  useRegisterMutation,
  useSignoutMutation,
  useLogoutMutation,
  useGetMeQuery,
  useAdminLoginMutation,
  useAdminLogoutMutation,
  useGetAdminMeQuery,
} = authApi;
