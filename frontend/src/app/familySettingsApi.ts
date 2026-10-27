import { apiSlice } from "./apiSlice";
import { familySettingsFromApi, familySettingsPayload, familySettingsRolesFromApi, type FamilySettingApiRecord, type FamilySettingResponse, type FamilySettingRoleApiRecord } from "./familySettingsApiMapper";
import type { FamilySettings, UpdateFamilySettingsInput } from "../types/familySettings";

export const familySettingsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Endpoint này để trong nhóm auth.optional nên khách cũng đọc được để ẩn/hiện mục chat.
    getFamilySettings: builder.query<FamilySettings, string>({
      query: () => ({ url: "/family-settings" }),
      transformResponse: (response: FamilySettingResponse) => familySettingsFromApi(response.data as FamilySettingApiRecord),
      providesTags: ["FamilySettings"],
    }),
    getFamilySettingRoles: builder.query<FamilySettingRoleApiRecord[], string>({
      query: () => ({ url: "/family-settings/roles" }),
      transformResponse: (response: { data?: FamilySettingRoleApiRecord[] }) => familySettingsRolesFromApi(response.data ?? []),
      providesTags: ["FamilySettings"],
    }),
    updateFamilySettings: builder.mutation<FamilySettings, UpdateFamilySettingsInput>({
      query: (settings) => ({ url: "/family-settings", method: "PUT", body: familySettingsPayload(settings) }),
      transformResponse: (response: FamilySettingResponse) => familySettingsFromApi(response.data as FamilySettingApiRecord),
      // Tắt/bật chat và quyền upload ảnh đều làm dữ liệu chat + album hiển thị sai nếu không refetch.
      invalidatesTags: ["FamilySettings", "ChatGroups", "ChatMessages", "Photos"],
    }),
  }),
});

export const { useGetFamilySettingsQuery, useGetFamilySettingRolesQuery, useUpdateFamilySettingsMutation } = familySettingsApiSlice;
