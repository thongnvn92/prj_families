import { useEffect, useState, type FormEvent } from "react";
import { LoaderCircle, LogIn, ShieldAlert } from "lucide-react";
import { useLoginMutation } from "../../app/authApi";
import { getApiErrorMessage } from "../../app/apiSlice";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginMutation, loginState] = useLoginMutation();

  useEffect(() => {
    if (!error) return;
    const timeout = window.setTimeout(() => setError(""), 5000);
    return () => window.clearTimeout(timeout);
  }, [error]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    try {
      await loginMutation({ email: email.trim(), password, device_name: "gia-pha-web" }).unwrap();
      setPassword("");
      onOpenChange(false);
    } catch (loginError) {
      setError(getApiErrorMessage(loginError, "Không thể đăng nhập. Vui lòng thử lại."));
    }
  };

  return <><Dialog open={open} onOpenChange={(nextOpen) => { if (!loginState.isLoading) { setError(""); onOpenChange(nextOpen); } }}><DialogContent><form onSubmit={(event) => void submit(event)}><DialogHeader><span className="flex size-11 items-center justify-center rounded-2xl bg-wine/10 text-wine"><LogIn className="size-5" /></span><DialogTitle>Đăng nhập dòng họ</DialogTitle><DialogDescription>Sử dụng tài khoản do Ban quản trị cấp để xem dữ liệu nội bộ và thực hiện thao tác được phân quyền.</DialogDescription></DialogHeader><div className="mt-5 space-y-4"><label className="block space-y-1.5"><span className="text-xs font-semibold text-stone-600">Email</span><Input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@gia-pha.local" /></label><label className="block space-y-1.5"><span className="text-xs font-semibold text-stone-600">Mật khẩu</span><Input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu" /></label></div><DialogFooter className="mt-5"><Button type="button" variant="outline" disabled={loginState.isLoading} onClick={() => onOpenChange(false)}>Hủy</Button><Button type="submit" disabled={loginState.isLoading || !email.trim() || !password}>{loginState.isLoading ? <LoaderCircle className="size-4 animate-spin" /> : <LogIn className="size-4" />}{loginState.isLoading ? "Đang kiểm tra..." : "Đăng nhập"}</Button></DialogFooter></form></DialogContent></Dialog>{error && <div role="alert" className="fixed bottom-5 right-5 z-[100] flex max-w-sm items-start gap-3 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-700 shadow-2xl"><ShieldAlert className="mt-0.5 size-5 shrink-0 text-red-600" />{error}</div>}</>;
}
