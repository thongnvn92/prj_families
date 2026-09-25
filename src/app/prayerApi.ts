import { apiSlice, runMockQuery } from "./apiSlice";
import type { AppRole } from "../context/AuthContext";
import { createPrayer, getPrayers, searchPrayers } from "../services/prayerService";
import type { CreatePrayerInput, Prayer, PrayerCategory } from "../types/prayer";

interface GetPrayersArgs { role: AppRole; category: PrayerCategory | "all"; query: string }
interface CreatePrayerArgs { role: AppRole; data: CreatePrayerInput }

export const prayerApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPrayers: builder.query<Prayer[], GetPrayersArgs>({
      queryFn: async ({ role, category, query }) => {
        if (query.trim()) {
          return runMockQuery(async () => {
            const result = await searchPrayers(query, role);
            return category === "all" ? result : result.filter((prayer) => prayer.category === category);
          });
        }
        return runMockQuery(() => getPrayers(category === "all" ? undefined : category, role));
      },
      providesTags: ["Prayers"],
    }),
    createPrayer: builder.mutation<Prayer, CreatePrayerArgs>({
      queryFn: ({ role, data }) => runMockQuery(() => createPrayer(data, role)),
      invalidatesTags: ["Prayers"],
    }),
  }),
});

export const { useGetPrayersQuery, useCreatePrayerMutation } = prayerApiSlice;
