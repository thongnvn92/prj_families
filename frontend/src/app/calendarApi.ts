import { apiSlice } from "./apiSlice";
import { dutyRegistrationFromApi, dutyRegistrationPayload, lunarEventListFromApi, lunarMonthFromApi, type EventDutyRegistrationResponse } from "./calendarApiMapper";
import type { AppRole } from "../context/AuthContext";
import type { EventDutyRegistration, EventDutyRegistrationInput, LunarEvent, LunarMonth } from "../types/calendar";

export interface GetUpcomingEventsArgs { authKey: AppRole }
export interface GetEventsByMonthArgs { authKey: AppRole; year: number; month: number }
export interface GetLunarMonthArgs { authKey: AppRole; year: number; month: number }
export interface RegisterDutyArgs { authKey: AppRole; eventId: string; dutyData: EventDutyRegistrationInput }

export const calendarApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUpcomingEvents: builder.query<LunarEvent[], GetUpcomingEventsArgs>({
      query: () => ({ url: "/calendar/events", params: { upcoming: 1 } }),
      transformResponse: lunarEventListFromApi,
      providesTags: ["CalendarEvents"],
    }),
    getEventsByMonth: builder.query<LunarEvent[], GetEventsByMonthArgs>({
      query: ({ year, month }) => ({ url: "/calendar/events", params: { year, month } }),
      transformResponse: lunarEventListFromApi,
      providesTags: ["CalendarEvents"],
    }),
    /** Nhãn ngày âm của tháng đang xem; backend tính sẵn theo lịch âm chuẩn. */
    getLunarMonth: builder.query<LunarMonth, GetLunarMonthArgs>({
      query: ({ year, month }) => ({ url: "/calendar/lunar-month", params: { year, month } }),
      transformResponse: lunarMonthFromApi,
      providesTags: ["LunarMonth"],
    }),
    registerEventDuty: builder.mutation<EventDutyRegistration, RegisterDutyArgs>({
      query: ({ eventId, dutyData }) => ({ url: `/calendar/events/${eventId}/register-duty`, method: "POST", body: dutyRegistrationPayload(dutyData) }),
      transformResponse: (response: EventDutyRegistrationResponse) => dutyRegistrationFromApi(response.data!),
      // Đăng ký nhiệm vụ làm status của sự kiện đổi sang registered nên cần refetch danh sách.
      invalidatesTags: ["CalendarEvents"],
    }),
  }),
});

export const { useGetUpcomingEventsQuery, useGetEventsByMonthQuery, useGetLunarMonthQuery, useRegisterEventDutyMutation } = calendarApiSlice;
