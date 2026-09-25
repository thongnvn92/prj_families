import type { Gender } from "../lib/mock-data";

export type MemberStatusFilter = "all" | "alive" | "deceased";

export interface MemberFormData {
  full_name: string;
  nickname: string;
  gender: Gender;
  father_id: string | null;
  mother_id: string | null;
  spouse_id: string | null;
  generation: number;
  order_in_family: number;
  is_alive: boolean;
  birth_date_solar: string;
  birth_day_lunar: number | null;
  birth_month_lunar: number | null;
  birth_year_lunar: number | null;
  death_date_solar: string;
  death_day_lunar: number | null;
  death_month_lunar: number | null;
  death_year_lunar: number | null;
  burial_place: string;
  burial_map_url: string;
  home_map_url: string;
  bio: string;
  avatar_url: string;
  phone: string;
  address: string;
}

export interface MemberListFilters {
  query?: string;
  generation?: number | "all";
  gender?: Gender | "all";
  status?: MemberStatusFilter;
}
