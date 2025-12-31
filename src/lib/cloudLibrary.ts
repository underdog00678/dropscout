import type { SavedProduct } from "./storage";
import type { ValidationResult } from "./types";
import { getSupabaseClient } from "./supabaseClient";

/*
SQL: Supabase table + RLS policies for dropscout_library_items

create table if not exists public.dropscout_library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  product_text text not null,
  created_at timestamptz not null default now(),
  result jsonb not null
);

alter table public.dropscout_library_items enable row level security;

create policy "Users can read their own library items"
on public.dropscout_library_items
for select
using (auth.uid() = user_id);

create policy "Users can insert their own library items"
on public.dropscout_library_items
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own library items"
on public.dropscout_library_items
for update
using (auth.uid() = user_id);

create policy "Users can delete their own library items"
on public.dropscout_library_items
for delete
using (auth.uid() = user_id);
*/

type CloudRow = {
  id: string;
  user_id: string;
  product_text: string;
  created_at: string;
  result: ValidationResult;
};

const toSavedProduct = (row: CloudRow): SavedProduct => ({
  id: row.id,
  productText: row.product_text,
  createdAt: row.created_at,
  result: row.result,
});

export const loadCloudLibrary = async (
  userId: string,
): Promise<SavedProduct[]> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("dropscout_library_items")
    .select("id, user_id, product_text, created_at, result")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(toSavedProduct);
};

export const addCloudItem = async (
  userId: string,
  item: SavedProduct,
): Promise<void> => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("dropscout_library_items").insert({
    user_id: userId,
    product_text: item.productText,
    created_at: item.createdAt,
    result: item.result,
  });

  if (error) {
    throw error;
  }
};

export const deleteCloudItem = async (
  userId: string,
  id: string,
): Promise<void> => {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("dropscout_library_items")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (error) {
    throw error;
  }
};
