import type { MemberFormData } from "../types/memberCrud";

const updateInfoFields = [
  "nickname", "role", "phone", "birthplace", "address", "bio", "burial_place",
  "burial_map_url", "home_map_url", "avatar_url", "birth_date_solar",
  "death_date_solar", "birth_day_lunar", "birth_month_lunar",
  "birth_year_lunar", "death_day_lunar", "death_month_lunar",
  "death_year_lunar",
] as const;

const addChildFields = [
  "full_name", "nickname", "role", "gender", "is_alive", "birth_date_solar",
  "death_date_solar", "birth_day_lunar", "birth_month_lunar",
  "birth_year_lunar", "death_day_lunar", "death_month_lunar",
  "death_year_lunar", "burial_place", "burial_map_url", "home_map_url",
  "bio", "avatar_url", "phone", "birthplace", "address", "order_in_family",
  "father_id", "mother_id",
] as const;

const blankToNull = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

function pick(form: MemberFormData, fields: readonly string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const value = (form as unknown as Record<string, unknown>)[field];
    if (value === undefined || value === null) continue;
    if (typeof value === "string") {
      const normalized = value.trim();
      if (!normalized) continue;
      result[field] = normalized;
      continue;
    }
    result[field] = value;
  }
  return result;
}

/**
 * Chuyển dữ liệu form thành payload `proposed_data` đúng allowlist mà backend chấp nhận.
 * Backend từ chối mọi field ngoài allowlist theo từng `edit_type`, nên không được gửi thừa.
 */
export function buildUpdateInfoProposal(form: MemberFormData): Record<string, unknown> {
  const proposed = pick(form, updateInfoFields);
  proposed.birth_date_solar = blankToNull(form.birth_date_solar) ?? proposed.birth_date_solar ?? null;
  proposed.death_date_solar = blankToNull(form.death_date_solar) ?? proposed.death_date_solar ?? null;
  return proposed;
}

export function buildAddChildProposal(form: MemberFormData): Record<string, unknown> {
  const proposed = pick(form, addChildFields);
  const fatherId = blankToNull(form.father_id);
  const motherId = blankToNull(form.mother_id);
  proposed.full_name = form.full_name.trim();
  proposed.gender = form.gender;
  proposed.is_alive = form.is_alive;
  proposed.birth_date_solar = blankToNull(form.birth_date_solar);
  proposed.death_date_solar = blankToNull(form.death_date_solar);
  proposed.father_id = fatherId ? Number(fatherId) : null;
  proposed.mother_id = motherId ? Number(motherId) : null;
  return proposed;
}
