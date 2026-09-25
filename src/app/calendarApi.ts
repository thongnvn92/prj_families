import { apiSlice, runMockQuery } from "./apiSlice";
import type { AppRole } from "../context/AuthContext";
import { getEventsByMonth, getUpcomingEvents, registerEventDuty } from "../services/calendarService";
import type { EventDutyRegistration, EventDutyRegistrationInput, LunarEvent } from "../types/calendar";

interface MonthEventsArgs { role: AppRole; year: number; month: number }
interface RegisterDutyArgs { role: AppRole; eventId: string; dutyData: EventDutyRegistrationInput }

export const calendarApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUpcomingEvents: builder.query<LunarEvent[], AppRole>({
      queryFn: (role) => runMockQuery(() => getUpcomingEvents(role)),
      providesTags: ["CalendarEvents"],
    }),
    getEventsByMonth: builder.query<LunarEvent[], MonthEventsArgs>({
      queryFn: ({ role, year, month }) => runMockQuery(() => getEventsByMonth(year, month, role)),
      providesTags: ["CalendarEvents"],
    }),
    registerEventDuty: builder.mutation<EventDutyRegistration, RegisterDutyArgs>({
      queryFn: ({ role, eventId, dutyData }) => runMockQuery(() => registerEventDuty(eventId, dutyData, role)),
      invalidatesTags: ["CalendarEvents"],
    }),
  }),
});

export const { useGetUpcomingEventsQuery, useGetEventsByMonthQuery, useRegisterEventDutyMutation } = calendarApiSlice;
