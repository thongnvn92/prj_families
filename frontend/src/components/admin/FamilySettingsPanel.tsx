import { useEffect, useState } from "react";
import { CheckCircle2, ImagePlus, LoaderCircle, MessageCircle, RefreshCw, Save, ShieldCheck, TriangleAlert } from "lucide-react";
import { getApiErrorMessage } from "../../app/apiSlice";
import { useGetFamilySettingRolesQuery, useGetFamilySettingsQuery, useUpdateFamilySettingsMutation } from "../../app/familySettingsApi";
import { useAuth } from "../../context/AuthContext";
import { useFamilySettings } from "../../lib/useFamilySettings";
import type { ImageUploadRole } from "../../types/familySettings";
import { AccessDenied } from "../common/AccessDenied";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Switch } from "../ui/switch";

const roleDescriptions: Record<ImageUploadRole, string> = {
  admin: "Trưởng Tộc — quản lý toàn dòng họ.",
  mod: "Trưởng Chi — quản lý nhánh được giao.",
  editor: "Tác viên — nhập liệu trong nhánh phụ trách.",
  member: "Thành viên chính thức — chỉ xem và gửi đề xuất.",
};

/** Bảng cấu hình tính năng do Admin (Trưởng Tộc) điều khiển. */
export function FamilySettingsPanel() {
  const { currentRole, isInitializing } = useAuth();
  const isAdmin = currentRole === "admin";
  const { data: settings, isFetching, refetch: refetchSettings } = useGetFamilySettingsQuery(`settings-${currentRole}`, { skip: isInitializing });
  const { data: roles = [], isLoading: loadingRoles } = useGetFamilySettingRolesQuery(`roles-${currentRole}`, { skip: !isAdmin || isInitializing });
  const [updateSettings, { isLoading: saving }] = useUpdateFamilySettingsMutation();
  const { chatEnabled: effectiveChatEnabled } = useFamilySettings();
  const [chatEnabled, setChatEnabled] = useState(true);
  const [uploadRoles, setUploadRoles] = useState<ImageUploadRole[]>([]);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!settings) return;
    setChatEnabled(settings.chatEnabled);
    setUploadRoles(settings.imageUploadRoles);
  }, [settings]);

  const toggleRole = (role: ImageUploadRole) => {
    setUploadRoles((current) => (current.includes(role) ? current.filter((item) => item !== role) : [...current, role]));
  };

  const save = async () => {
    if (uploadRoles.length === 0) {
      setError("Cần ít nhất một vai trò được phép đưa hình ảnh lên hệ thống.");
      return;
    }
    setError("");
    try {
      await updateSettings({ chatEnabled, imageUploadRoles: uploadRoles }).unwrap();
      setToast("Đã lưu cấu hình tính năng cho dòng họ.");
      window.setTimeout(() => setToast(""), 4000);
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, "Không thể lưu cấu hình tính năng."));
    }
  };

  if (!isAdmin) return <AccessDenied title="Không có quyền cấu hình" description="Chỉ Admin (Trưởng Tộc) mới được bật/tắt tính năng chat và cấp quyền đưa hình ảnh lên hệ thống." />;

  return <div className="mx-auto max-w-4xl space-y-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-deep">Ban Trưởng tộc · Cấu hình</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-stone-900">Cấu hình tính năng dòng họ</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">Bật/tắt Trò chuyện nội bộ và quy định ai được đưa hình ảnh lên Album gia đình.</p>
      </div>
      <Button variant="outline" size="sm" onClick={refetchSettings} disabled={isFetching}>
        <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />Tải lại
      </Button>
    </div>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MessageCircle className="size-5 text-wine" />Trò chuyện nội bộ</CardTitle>
        <CardDescription>Tắt tính năng sẽ khoá toàn bộ nhóm chat, tin nhắn và kết nối thời gian thực của dòng họ.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-800">Cho phép thành viên trò chuyện</p>
            <p className="mt-1 text-xs leading-5 text-stone-500">Khi tắt, mọi tài khoản đều không đọc/gửi được tin nhắn cho tới khi Admin bật lại.</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Badge variant={chatEnabled ? "success" : "outline"} className={chatEnabled ? undefined : "border-red-200 bg-red-50 text-red-700"}>{chatEnabled ? "Đang bật" : "Đang tắt"}</Badge>
            <Switch checked={chatEnabled} onCheckedChange={setChatEnabled} disabled={saving} aria-label="Bật hoặc tắt Trò chuyện nội bộ" />
          </div>
        </div>
        {!effectiveChatEnabled && <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-800"><TriangleAlert className="mt-0.5 size-3.5 shrink-0" />Chat hiện đang bị khoá. Các thay đổi ở đây có hiệu lực sau khi lưu.</p>}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ImagePlus className="size-5 text-wine" />Quyền đưa hình ảnh lên hệ thống</CardTitle>
        <CardDescription>Áp dụng cho ảnh Album gia đình và ảnh đính kèm trong tin nhắn chat. Khách (Guest) không bao giờ được tải ảnh.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loadingRoles ? <div className="flex justify-center py-6"><LoaderCircle className="size-6 animate-spin text-wine" /></div> : roles.map((role) => {
          const checked = uploadRoles.includes(role.value);
          return <label key={role.value} className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${checked ? "border-wine/35 bg-wine/[0.04]" : "border-stone-200 bg-white hover:border-stone-300"}`}>
            <input type="checkbox" checked={checked} onChange={() => toggleRole(role.value)} disabled={saving} className="mt-1 size-4 shrink-0 accent-[#8c2427]" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-stone-800">{role.label}</span>
              <span className="mt-0.5 block text-xs leading-5 text-stone-500">{roleDescriptions[role.value]}</span>
            </span>
            {checked && <Badge variant="softWine" className="shrink-0">Được phép</Badge>}
          </label>;
        })}
      </CardContent>
    </Card>

    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">{error}</p>}

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2 text-xs leading-5 text-stone-500"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-gold" />Thay đổi có hiệu lực ngay với mọi thành viên của dòng họ.</p>
      <Button onClick={save} disabled={saving || isFetching}>
        {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}{saving ? "Đang lưu..." : "Lưu cấu hình"}
      </Button>
    </div>

    {toast && <div role="status" className="fixed bottom-5 right-5 z-[70] flex max-w-sm items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" /><p className="text-sm font-semibold leading-5 text-stone-700">{toast}</p></div>}
  </div>;
}
