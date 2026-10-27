import { apiSlice } from "./apiSlice";
import { pendingEditFromApi, pendingEditListFromApi, pendingEditPayload, type CreatePendingEditInput, type PendingEditApiRecord, type PendingEditListResponse, type PendingEditResponse } from "./pendingEditApiMapper";
import type { AppRole } from "../context/AuthContext";
import type { PendingEdit, PendingEditStatus } from "../types/pendingEdit";

export interface GetPendingEditsArgs { authKey: AppRole; status?: PendingEditStatus | "all" }
export interface CreateEditArgs { data: CreatePendingEditInput }
export interface EditActionArgs { id: string }
export interface RejectEditArgs extends EditActionArgs { reason: string }

export const pendingEditApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPendingEdits: builder.query<PendingEdit[], GetPendingEditsArgs>({
      query: ({ status }) => ({ url: "/pending-edits", params: status && status !== "all" ? { status } : {} }),
      transformResponse: (response: PendingEditListResponse) => pendingEditListFromApi(response),
      providesTags: ["PendingEdits"],
    }),
    createPendingEdit: builder.mutation<PendingEdit, CreateEditArgs>({
      query: ({ data }) => ({ url: "/pending-edits", method: "POST", body: pendingEditPayload(data) }),
      transformResponse: (response: PendingEditResponse) => pendingEditFromApi(response.data as PendingEditApiRecord),
      // Duyệt đề xuất add_child/add_spouse có thể tạo hoặc sửa Member, nên cache Members cũng phải invalid.
      invalidatesTags: ["PendingEdits", "Members"],
    }),
    approveEdit: builder.mutation<PendingEdit, EditActionArgs>({
      query: ({ id }) => ({ url: `/pending-edits/${id}/approve`, method: "POST" }),
      transformResponse: (response: PendingEditResponse) => pendingEditFromApi(response.data as PendingEditApiRecord),
      invalidatesTags: ["PendingEdits", "Members"],
    }),
    rejectEdit: builder.mutation<PendingEdit, RejectEditArgs>({
      query: ({ id, reason }) => ({ url: `/pending-edits/${id}/reject`, method: "POST", body: { reason: reason.trim() } }),
      transformResponse: (response: PendingEditResponse) => pendingEditFromApi(response.data as PendingEditApiRecord),
      invalidatesTags: ["PendingEdits"],
    }),
  }),
});

export const { useGetPendingEditsQuery, useCreatePendingEditMutation, useApproveEditMutation, useRejectEditMutation } = pendingEditApiSlice;
