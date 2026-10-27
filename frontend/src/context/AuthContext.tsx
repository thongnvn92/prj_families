import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useGetMeQuery } from "../app/authApi";
import { useAppSelector } from "../app/hooks";
import type { AuthUser } from "../app/authSlice";

export type AppRole = "admin" | "mod" | "editor" | "member" | "guest";
export type PermissionKey = keyof RolePermissions;

export const roleLabels: Record<AppRole, string> = { admin: "Admin", mod: "Mod", editor: "Editor", member: "Member", guest: "Guest" };

export interface RolePermissions {
  canViewPrivateData: boolean;
  canSuggestEdits: boolean;
  canDirectlyEdit: boolean;
  canApproveEdits: boolean;
  canManagePendingEdits: boolean;
  canViewGroupChat: boolean;
  canUsePrivateSections: boolean;
  canCreateChatGroup: boolean;
  canCreatePrayer: boolean;
  canDeleteMembers: boolean;
  canUploadPhotos: boolean;
}

const permissionMatrix: Record<AppRole, RolePermissions> = {
  admin: { canViewPrivateData: true, canSuggestEdits: true, canDirectlyEdit: true, canApproveEdits: true, canManagePendingEdits: true, canViewGroupChat: true, canUsePrivateSections: true, canCreateChatGroup: true, canCreatePrayer: true, canDeleteMembers: true, canUploadPhotos: true },
  mod: { canViewPrivateData: true, canSuggestEdits: true, canDirectlyEdit: true, canApproveEdits: true, canManagePendingEdits: true, canViewGroupChat: true, canUsePrivateSections: true, canCreateChatGroup: true, canCreatePrayer: false, canDeleteMembers: true, canUploadPhotos: true },
  editor: { canViewPrivateData: true, canSuggestEdits: true, canDirectlyEdit: true, canApproveEdits: false, canManagePendingEdits: false, canViewGroupChat: true, canUsePrivateSections: true, canCreateChatGroup: false, canCreatePrayer: false, canDeleteMembers: false, canUploadPhotos: true },
  member: { canViewPrivateData: true, canSuggestEdits: true, canDirectlyEdit: false, canApproveEdits: false, canManagePendingEdits: false, canViewGroupChat: true, canUsePrivateSections: true, canCreateChatGroup: false, canCreatePrayer: false, canDeleteMembers: false, canUploadPhotos: false },
  guest: { canViewPrivateData: false, canSuggestEdits: false, canDirectlyEdit: false, canApproveEdits: false, canManagePendingEdits: false, canViewGroupChat: false, canUsePrivateSections: false, canCreateChatGroup: false, canCreatePrayer: false, canDeleteMembers: false, canUploadPhotos: false },
};

export interface AuthContextValue {
  currentRole: AppRole;
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  permissions: RolePermissions;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function hasRolePermission(role: AppRole, permission: PermissionKey): boolean {
  return permissionMatrix[role][permission];
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { token, user, sessionVersion } = useAppSelector((state) => state.auth);
  const { data } = useGetMeQuery(`session-${sessionVersion}`, { skip: !token });
  const currentUser = user ?? (token ? data ?? null : null);
  const currentRole = currentUser?.role ?? "guest";
  const permissions = useMemo(() => permissionMatrix[currentRole], [currentRole]);
  const isInitializing = Boolean(token && !currentUser);
  return <AuthContext.Provider value={{ currentRole, user: currentUser, token, isAuthenticated: Boolean(currentUser), isInitializing, permissions }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải được sử dụng bên trong AuthProvider.");
  return context;
}

