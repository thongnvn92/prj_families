import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { familyMembers, type FamilyMember } from "../../lib/mock-data";
import { TreeCanvas } from "./TreeCanvas";

function member(overrides: Partial<FamilyMember> & Pick<FamilyMember, "id" | "name" | "generation">): FamilyMember {
  return {
    ...familyMembers[0],
    fatherId: undefined,
    motherId: undefined,
    spouseId: undefined,
    ...overrides,
    isAlive: true,
  };
}

describe("TreeCanvas", () => {
  it("renders descendants linked to either parent in a spouse pair", () => {
    const root = member({ id: "root", name: "Bà Tổ", generation: 1, spouseId: "root-spouse" });
    const rootSpouse = member({ id: "root-spouse", name: "Ông Phối Ngẫu", generation: 1, spouseId: root.id });
    const child = member({ id: "child", name: "Con", generation: 2, fatherId: rootSpouse.id, motherId: root.id, spouseId: "child-spouse" });
    const childSpouse = member({ id: "child-spouse", name: "Phối Ngẫu Của Con", generation: 2, spouseId: child.id });
    const grandchild = member({ id: "grandchild", name: "Cháu", generation: 3, fatherId: child.id, motherId: childSpouse.id, spouseId: "grandchild-spouse" });
    const grandchildSpouse = member({ id: "grandchild-spouse", name: "Phối Ngẫu Của Cháu", generation: 3, spouseId: grandchild.id });
    const greatGrandchild = member({ id: "great-grandchild", name: "Chắt", generation: 4, fatherId: grandchildSpouse.id, motherId: grandchild.id });

    render(
      <TreeCanvas
        root={root}
        allMembers={[root, rootSpouse, child, childSpouse, grandchild, grandchildSpouse, greatGrandchild]}
        showDeceased
        searchQuery=""
        zoom={1}
        onSelectMember={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Xem hồ sơ Chắt" })).toBeInTheDocument();
  });

  it("renders multiple spouses and children from each spouse", () => {
    const husband = member({ id: "husband", name: "Ông Chồng", generation: 1, spouseId: "wife-one" });
    const firstWife = member({ id: "wife-one", name: "Bà Vợ Một", generation: 1, spouseId: husband.id });
    const secondWife = member({ id: "wife-two", name: "Bà Vợ Hai", generation: 1, spouseId: husband.id });
    const firstChild = member({ id: "first-child", name: "Con Vợ Một", generation: 2, fatherId: husband.id, motherId: firstWife.id });
    const secondChild = member({ id: "second-child", name: "Con Vợ Hai", generation: 2, fatherId: husband.id, motherId: secondWife.id });

    render(
      <TreeCanvas
        root={husband}
        allMembers={[husband, firstWife, secondWife, firstChild, secondChild]}
        showDeceased
        searchQuery=""
        zoom={1}
        onSelectMember={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Xem hồ sơ Bà Vợ Một" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xem hồ sơ Bà Vợ Hai" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xem hồ sơ Con Vợ Một" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xem hồ sơ Con Vợ Hai" })).toBeInTheDocument();
  });
});
