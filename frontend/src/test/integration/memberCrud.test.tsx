import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemberFormModal } from "../../components/directory/MemberFormModal";
import { store } from "../../app/store";
import { memberApiSlice, useGetMembersQuery } from "../../app/memberApi";
import { mockFetch, renderWithProviders, resetApiState, signIn } from "../integration";
import { authUser, sampleMembers } from "../fixtures";
import type { AppRole } from "../../context/AuthContext";
import type { FamilyMember } from "../../lib/mock-data";
import type { MemberFormData } from "../../types/memberCrud";

const { createMember } = memberApiSlice.endpoints;

const h = vi.hoisted(() => ({ currentRole: "admin" as AppRole }));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    currentRole: h.currentRole,
    user: { name: "Admin" },
    isInitializing: false,
    permissions: { canDirectlyEdit: h.currentRole !== "guest", canSuggestEdits: h.currentRole !== "guest" },
  }),
}));

/** Record API cho bảng members (snake_case) đúng contract Laravel. */
function apiMember(id: number, name: string): Record<string, unknown> {
  return {
    id, family_id: 1, full_name: name, nickname: null, gender: "male", generation: 1,
    order_in_family: 1, is_alive: true, birth_date_solar: null, death_date_solar: null,
    burial_place: null, burial_map_url: null, home_map_url: null, bio: null, avatar_url: null,
    phone: "0912345678", address: "Bắc Ninh", father_id: null, mother_id: null, spouse_id: null,
    created_at: "2026-01-01T00:00:00+07:00",
  };
}

function blankForm(name: string): MemberFormData {
  return {
    full_name: name, nickname: "", gender: "male", father_id: null, mother_id: null, spouse_id: null,
    generation: 1, order_in_family: 1, is_alive: true, birth_date_solar: "",
    birth_day_lunar: null, birth_month_lunar: null, birth_year_lunar: null,
    death_date_solar: "", death_day_lunar: null, death_month_lunar: null, death_year_lunar: null,
    burial_place: "", burial_map_url: "", home_map_url: "", bio: "", avatar_url: "", phone: "", birthplace: "", address: "",
  };
}

/** Cây gia phả subscribe thật vào cache RTK Query. */
function Tree() {
  const { data } = useGetMembersQuery({ authKey: "admin", filters: {} });
  return (
    <ul data-testid="tree">
      {(data ?? []).map((member: FamilyMember) => <li key={member.id}>{member.name}</li>)}
    </ul>
  );
}

beforeEach(() => {
  resetApiState();
  h.currentRole = "admin";
  signIn(authUser("admin"), "tok-admin");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("IT-MEMBER-CRUD – Normal / Cache Invalidation", () => {
  it("GET members được cache: component khác cùng cache key không gọi lại API", async () => {
    const { calls } = mockFetch({ "GET /api/v1/members": { body: { data: [apiMember(1, "Nguyễn Văn Minh")] } } });

    // Hai component cùng cache key chỉ gây ra MỘT lần gọi GET.
    renderWithProviders(<><Tree /><Tree /></>);
    await waitFor(() => expect(screen.getAllByText("Nguyễn Văn Minh")).toHaveLength(2));

    expect(calls.filter((c) => c.method === "GET")).toHaveLength(1);
  });

  it("POST member thành công sẽ invalidate tag Members và refetch danh sách", async () => {
    const { calls } = mockFetch({
      "GET /api/v1/members": () => ({
        body: { data: calls.some((c) => c.method === "POST") ? [apiMember(1, "A"), apiMember(2, "B")] : [apiMember(1, "A")] },
      }),
      "POST /api/v1/members": { status: 201, body: { data: apiMember(2, "B") } },
    });

    renderWithProviders(<Tree />);
    await waitFor(() => expect(screen.getByText("A")).toBeInTheDocument());

    await store.dispatch(createMember.initiate({ data: blankForm("B") })).unwrap();

    await waitFor(() => expect(screen.getByText("B")).toBeInTheDocument());
    expect(calls.filter((c) => c.method === "GET").length).toBeGreaterThanOrEqual(2);
  });

  it("Flow 2: Mở modal -> validate -> submit -> cây gia phả tự cập nhật", async () => {
    let created = false;
    mockFetch({
      "GET /api/v1/members": () => ({
        body: { data: created ? [apiMember(1, "Nguyễn Văn Minh"), apiMember(2, "Nguyễn Văn Mới")] : [apiMember(1, "Nguyễn Văn Minh")] },
      }),
      "POST /api/v1/members": () => {
        created = true;
        return { status: 201, body: { data: apiMember(2, "Nguyễn Văn Mới") } };
      },
    });

    const user = userEvent.setup();
    const onSubmit = async (formData: MemberFormData) => {
      await store.dispatch(createMember.initiate({ data: formData })).unwrap();
    };

    renderWithProviders(
      <>
        <Tree />
        <MemberFormModal open onOpenChange={vi.fn()} member={null} members={sampleMembers} onSubmit={onSubmit} />
      </>,
    );
    await waitFor(() => expect(screen.getByText("Nguyễn Văn Minh")).toBeInTheDocument());
    expect(screen.queryByText("Nguyễn Văn Mới")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Họ và tên *"), "Nguyễn Văn Mới");
    await user.click(screen.getByRole("button", { name: /Thêm thành viên/ }));

    await waitFor(() => expect(screen.getByTestId("tree")).toHaveTextContent("Nguyễn Văn Mới"));
  });
});

describe("IT-MEMBER-CRUD – Exception Cases", () => {
  /** Nối form vào API thật để kiểm tra lỗi đi từ server về UI. */
  function renderFormWithServerError() {
    const onSubmit = async (data: MemberFormData) => {
      try {
        await store.dispatch(createMember.initiate({ data })).unwrap();
      } catch (error) {
        throw new Error((error as { data?: { message?: string } })?.data?.message ?? "Không thể lưu thông tin.");
      }
    };
    return renderWithProviders(
      <MemberFormModal open onOpenChange={vi.fn()} member={null} members={sampleMembers} onSubmit={onSubmit} />,
    );
  }

  it("422 từ server: giữ nguyên modal và hiện lỗi tiếng Việt", async () => {
    mockFetch({
      "POST /api/v1/members": { status: 422, body: { message: "Ngày sinh không hợp lệ.", errors: { birth_date_solar: ["Sai định dạng."] } } },
    });
    const user = userEvent.setup();
    renderFormWithServerError();

    await user.type(screen.getByLabelText("Họ và tên *"), "Nguyễn Văn A");
    await user.click(screen.getByRole("button", { name: /Thêm thành viên/ }));

    expect(await screen.findByText("Ngày sinh không hợp lệ.")).toBeInTheDocument();
    expect(screen.getByText("Thêm thành viên mới")).toBeInTheDocument();
  });

  it("403 khi role không đủ quyền: API từ chối và form vẫn mở", async () => {
    mockFetch({ "POST /api/v1/members": { status: 403, body: { message: "Bạn không có quyền thực hiện thao tác này." } } });
    const user = userEvent.setup();
    renderFormWithServerError();

    await user.type(screen.getByLabelText("Họ và tên *"), "Nguyễn Văn B");
    await user.click(screen.getByRole("button", { name: /Thêm thành viên/ }));

    expect(await screen.findByText("Bạn không có quyền thực hiện thao tác này.")).toBeInTheDocument();
    expect(screen.getByText("Thêm thành viên mới")).toBeInTheDocument();
  });

  it("500: hiển thị thông báo lỗi, không làm sập form", async () => {
    mockFetch({ "POST /api/v1/members": { status: 500, body: { message: "Lỗi máy chủ nội bộ." } } });
    const user = userEvent.setup();
    renderFormWithServerError();

    await user.type(screen.getByLabelText("Họ và tên *"), "Nguyễn Văn C");
    await user.click(screen.getByRole("button", { name: /Thêm thành viên/ }));

    expect(await screen.findByText("Lỗi máy chủ nội bộ.")).toBeInTheDocument();
  });

  it("mất mạng: báo lỗi chung, không crash", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));
    const user = userEvent.setup();
    renderFormWithServerError();

    await user.type(screen.getByLabelText("Họ và tên *"), "Nguyễn Văn D");
    await user.click(screen.getByRole("button", { name: /Thêm thành viên/ }));

    expect(await screen.findByText("Không thể lưu thông tin.")).toBeInTheDocument();
  });
});

