import { LockKeyhole, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "../ui/card";

interface AccessDeniedProps {
  title?: string;
  description?: string;
}

export function AccessDenied({ title = "Khu vực dành cho thành viên", description = "Bạn cần đăng nhập tài khoản Thành viên dòng họ để xem khu vực nội bộ này." }: AccessDeniedProps) {
  return (
    <Card className="mx-auto mt-10 max-w-2xl border-amber-200 bg-amber-50/70">
      <CardContent className="p-10 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-white text-amber-700 shadow-sm ring-1 ring-amber-200">
          <LockKeyhole className="size-8" />
        </span>
        <h2 className="mt-5 font-display text-2xl font-semibold text-stone-900">{title}</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-stone-600">{description}</p>
        <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-3 text-xs font-medium text-amber-800">
          <ShieldCheck className="size-4" /> Dữ liệu nội bộ đã được bảo vệ theo vai trò.
        </div>
      </CardContent>
    </Card>
  );
}
