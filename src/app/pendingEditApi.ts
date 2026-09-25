import { apiSlice, runMockQuery } from "./apiSlice";
import type { AppRole } from "../context/AuthContext";
import { approveEdit, createPendingEdit, getPendingEdits, rejectEdit } from "../services/pendingEditService";
import type { PendingEdit } from "../types/pendingEdit";

type CreateEditData = Omit<PendingEdit, "id" | "status" | "createdAt">;
interface CreateEditArgs { role: AppRole; data: CreateEditData }
interface EditActionArgs { role: AppRole; id: string }
interface RejectEditArgs extends EditActionArgs { reason: string }

export const pendingEditApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPendingEdits: builder.query<PendingEdit[], AppRole>({
      queryFn: (role) => runMockQuery(() => getPendingEdits(role)),
      providesTags: ["PendingEdits"],
    }),
    createPendingEdit: builder.mutation<PendingEdit, CreateEditArgs>({
      queryFn: ({ role, data }) => runMockQuery(() => createPendingEdit(data, role)),
      invalidatesTags: ["PendingEdits"],
    }),
    approveEdit: builder.mutation<PendingEdit, EditActionArgs>({
      queryFn: ({ role, id }) => runMockQuery(() => approveEdit(id, role)),
      invalidatesTags: ["PendingEdits"],
    }),
    rejectEdit: builder.mutation<PendingEdit, RejectEditArgs>({
      queryFn: ({ role, id, reason }) => runMockQuery(() => rejectEdit(id, reason, role)),
      invalidatesTags: ["PendingEdits"],
    }),
  }),
});

export const { useGetPendingEditsQuery, useCreatePendingEditMutation, useApproveEditMutation, useRejectEditMutation } = pendingEditApiSlice;
