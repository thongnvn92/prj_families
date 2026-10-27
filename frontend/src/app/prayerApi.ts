import { apiSlice } from "./apiSlice";
import { prayerFromApi, prayerListFromApi, prayerPayload, type PrayerApiRecord, type PrayerListResponse, type PrayerResponse } from "./prayerApiMapper";
import type { AppRole } from "../context/AuthContext";
import type { CreatePrayerInput, Prayer, PrayerCategory } from "../types/prayer";

export interface GetPrayersArgs { authKey: AppRole; category: PrayerCategory | "all"; query: string }
export interface CreatePrayerArgs { data: CreatePrayerInput; familyId?: number | null }
export interface GetPrayerByIdArgs { authKey: AppRole; id: string }

const prayerParams = (args: GetPrayersArgs) => ({
  ...(args.category && args.category !== "all" ? { category: args.category } : {}),
  ...(args.query.trim() ? { query: args.query.trim() } : {}),
});

export const prayerApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPrayers: builder.query<Prayer[], GetPrayersArgs>({
      query: (args) => ({ url: "/prayers", params: prayerParams(args) }),
      transformResponse: (response: PrayerListResponse) => prayerListFromApi(response),
      providesTags: ["Prayers"],
    }),
    getPrayerById: builder.query<Prayer, GetPrayerByIdArgs>({
      query: ({ id }) => ({ url: `/prayers/${id}` }),
      transformResponse: (response: PrayerApiRecord | PrayerResponse) => prayerFromApi((response as PrayerResponse).data ?? response as PrayerApiRecord),
      providesTags: (_result, _error, { id }) => [{ type: "Prayers", id }],
    }),
    createPrayer: builder.mutation<Prayer, CreatePrayerArgs>({
      query: ({ data, familyId }) => ({ url: "/prayers", method: "POST", body: prayerPayload(data, familyId) }),
      transformResponse: (response: PrayerResponse) => prayerFromApi(response.data as PrayerApiRecord),
      invalidatesTags: ["Prayers"],
    }),
    updatePrayer: builder.mutation<Prayer, { id: string; data: Partial<CreatePrayerInput> }>({
      query: ({ id, data }) => ({ url: `/prayers/${id}`, method: "PUT", body: prayerPayload(data as CreatePrayerInput) }),
      transformResponse: (response: PrayerApiRecord | PrayerResponse) => prayerFromApi((response as PrayerResponse).data ?? response as PrayerApiRecord),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Prayers", id }, "Prayers"],
    }),
    deletePrayer: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `/prayers/${id}`, method: "DELETE" }),
      invalidatesTags: ["Prayers"],
    }),
  }),
});

export const {
  useGetPrayersQuery,
  useGetPrayerByIdQuery,
  useCreatePrayerMutation,
  useUpdatePrayerMutation,
  useDeletePrayerMutation,
} = prayerApiSlice;
