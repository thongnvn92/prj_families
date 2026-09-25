import { apiSlice } from "./apiSlice";
import { memberFromApi, memberListFromApi, memberPayload, type MemberApiRecord, type MemberListResponse, type MemberResponse } from "./memberApiMapper";
import type { AppRole } from "../context/AuthContext";
import type { FamilyMember } from "../lib/mock-data";
import type { MemberFormData, MemberListFilters } from "../types/memberCrud";

export interface MemberListArgs { authKey: AppRole; filters: MemberListFilters }
export interface MemberQueryArgs { authKey: AppRole; filters?: MemberListFilters }
export interface MemberByIdArgs { authKey: AppRole; id: string }
interface SearchMembersArgs { authKey: AppRole; query: string }
interface CreateMemberArgs { data: MemberFormData; familyId?: number | null }
interface UpdateMemberArgs { id: string; data: MemberFormData }
export interface DeleteMemberResult { message: string }

const memberParams = (filters: MemberListFilters) => ({
  per_page: 100,
  ...(filters.query?.trim() ? { search: filters.query.trim() } : {}),
  ...(filters.generation && filters.generation !== "all" ? { generation: filters.generation } : {}),
  ...(filters.gender && filters.gender !== "all" ? { gender: filters.gender } : {}),
  ...(filters.status === "alive" ? { is_alive: true } : {}),
  ...(filters.status === "deceased" ? { is_alive: false } : {}),
});

export const memberApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMembers: builder.query<FamilyMember[], MemberQueryArgs>({
      query: ({ filters = {} }) => ({ url: "/members", params: memberParams(filters) }),
      transformResponse: (response: MemberListResponse) => memberListFromApi(response),
      providesTags: ["Members"],
    }),
    getMemberById: builder.query<FamilyMember, MemberByIdArgs>({
      query: ({ id }) => ({ url: `/members/${id}` }),
      transformResponse: (response: MemberApiRecord) => memberFromApi(response),
      providesTags: (_result, _error, { id }) => [{ type: "Members", id }],
    }),
    getMembersList: builder.query<FamilyMember[], MemberListArgs>({
      query: ({ filters }) => ({ url: "/members", params: memberParams(filters) }),
      transformResponse: (response: MemberListResponse) => memberListFromApi(response),
      providesTags: ["Members"],
    }),
    searchMembers: builder.query<FamilyMember[], SearchMembersArgs>({
      query: ({ query }) => ({ url: "/members", params: { search: query, per_page: 10 } }),
      transformResponse: (response: MemberListResponse) => memberListFromApi(response),
      providesTags: ["Members"],
    }),
    createMember: builder.mutation<FamilyMember, CreateMemberArgs>({
      query: ({ data, familyId }) => ({ url: "/members", method: "POST", body: memberPayload(data, familyId) }),
      transformResponse: (response: MemberResponse) => memberFromApi(response.data as MemberApiRecord),
      invalidatesTags: ["Members"],
    }),
    updateMember: builder.mutation<FamilyMember, UpdateMemberArgs>({
      query: ({ id, data }) => ({ url: `/members/${id}`, method: "PUT", body: memberPayload(data) }),
      transformResponse: (response: MemberApiRecord | MemberResponse) => memberFromApi((response as MemberResponse).data ?? response as MemberApiRecord),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Members", id }, "Members"],
    }),
    deleteMember: builder.mutation<DeleteMemberResult, string>({
      query: (id) => ({ url: `/members/${id}`, method: "DELETE" }),
      invalidatesTags: ["Members"],
    }),
  }),
});

export const {
  useGetMembersQuery,
  useLazyGetMemberByIdQuery,
  useGetMembersListQuery,
  useSearchMembersQuery,
  useCreateMemberMutation,
  useUpdateMemberMutation,
  useDeleteMemberMutation,
} = memberApiSlice;
