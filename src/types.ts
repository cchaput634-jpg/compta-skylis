export interface DiscordUser {
  discord_id: string;
  username: string;
  avatar: string | null;
}

export interface MeResponse {
  user: DiscordUser | null;
  permissions: string[];
  isSuper: boolean;
}

export interface Role {
  id: string;
  name: string;
  isSuper: boolean;
  permissions: string[];
}

export interface AdminUser {
  discord_id: string;
  username: string;
  avatar: string | null;
  last_seen: number;
  roles: string[];
}

export interface Citizen {
  id: string;
  name: string;
  title: string | null;
  discord_id: string | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

export interface Donation {
  id: string;
  citizen_id: string | null;
  citizen_label: string | null;
  citizen_name: string | null;
  citizen_title: string | null;
  amount: number;
  occurred_at: number;
  description: string | null;
  created_by: string;
  created_at: number;
}

export interface Expense {
  id: string;
  label: string;
  category: string | null;
  amount: number;
  occurred_at: number;
  description: string | null;
  created_by: string;
  created_at: number;
}

export interface Gain {
  id: string;
  label: string;
  category: string | null;
  amount: number;
  occurred_at: number;
  description: string | null;
  created_by: string;
  created_at: number;
}

export interface TopDonor {
  citizen_id: string | null;
  display_name: string | null;
  title: string | null;
  label: string | null;
  total: number;
  n: number;
  last_donation: number;
}

export interface Summary {
  donations: { n: number; total: number } | null;
  gains: { n: number; total: number } | null;
  expenses: { n: number; total: number } | null;
  citizens: { n: number } | null;
  balance: number | null;
}

/* Permissions utilisées par le front pour afficher/masquer. */
export type PermissionKey =
  | "manage_users"
  | "citizens.view"
  | "citizens.edit"
  | "donations.view"
  | "donations.edit"
  | "gains.view"
  | "gains.edit"
  | "expenses.view"
  | "expenses.edit";
