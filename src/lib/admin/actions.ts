"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, AdminAuthError } from "@/lib/admin/auth";
import { createServiceClient, hasServiceRole } from "@/lib/admin/service-client";
import {
  type AdminTable,
  type Row,
  parseOrder,
  ADMIN_TABLES,
} from "@/lib/admin/tables";

export type AdminActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toErrorMessage(error: unknown): string {
  if (error instanceof AdminAuthError) return error.message;
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

async function getAdminSupabase() {
  await requireAdmin();
  return createClient();
}

export async function adminList(
  table: AdminTable,
  order = "-created_at",
  limit = 100
): Promise<AdminActionResult<Row[]>> {
  try {
    const supabase = await getAdminSupabase();
    const { column, ascending } = parseOrder(order);
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(column, { ascending })
      .limit(limit);
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []) as Row[] };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}

export async function adminGet(
  table: AdminTable,
  id: string
): Promise<AdminActionResult<Row | null>> {
  try {
    const supabase = await getAdminSupabase();
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as Row | null };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}

export async function adminCreate(
  table: AdminTable,
  payload: Row,
  revalidatePaths: string[] = ["/admin"]
): Promise<AdminActionResult<Row>> {
  try {
    const supabase = await getAdminSupabase();
    const { data, error } = await supabase
      .from(table)
      .insert(payload as never)
      .select()
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePaths.forEach((p) => revalidatePath(p));
    return { ok: true, data: data as Row };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}

export async function adminUpdate(
  table: AdminTable,
  id: string,
  payload: Row,
  revalidatePaths: string[] = ["/admin"]
): Promise<AdminActionResult<Row>> {
  try {
    const supabase = await getAdminSupabase();
    const { data, error } = await supabase
      .from(table)
      .update(payload as never)
      .eq("id", id)
      .select()
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePaths.forEach((p) => revalidatePath(p));
    return { ok: true, data: data as Row };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}

export async function adminDelete(
  table: AdminTable,
  id: string,
  revalidatePaths: string[] = ["/admin"]
): Promise<AdminActionResult<null>> {
  try {
    const supabase = await getAdminSupabase();
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePaths.forEach((p) => revalidatePath(p));
    return { ok: true, data: null };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}

export async function adminUpdateProfileRole(
  userId: string,
  role: string
): Promise<AdminActionResult<Row>> {
  try {
    await requireAdmin();
    const validRoles = ["user", "admin", "host", "vet"];
    if (!validRoles.includes(role)) {
      return { ok: false, error: "Invalid role" };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from(ADMIN_TABLES.profiles)
      .update({ role, updated_at: new Date().toISOString() } as never)
      .eq("id", userId)
      .select()
      .single();
    if (error) return { ok: false, error: error.message };

    if (hasServiceRole()) {
      const service = createServiceClient();
      const { error: authError } = await service.auth.admin.updateUserById(
        userId,
        { app_metadata: { role } }
      );
      if (authError) {
        return {
          ok: false,
          error: `Profile updated but auth sync failed: ${authError.message}`,
        };
      }
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { ok: true, data: data as Row };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}

export async function adminGetDashboardStats(): Promise<
  AdminActionResult<Record<string, number>>
> {
  try {
    const supabase = await getAdminSupabase();
    const tables = Object.values(ADMIN_TABLES);
    const counts: Record<string, number> = {};

    await Promise.all(
      tables.map(async (table) => {
        const { count, error } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true });
        counts[table] = error ? 0 : (count ?? 0);
      })
    );

    const { count: pendingVets } = await supabase
      .from(ADMIN_TABLES.vet_clinics)
      .select("*", { count: "exact", head: true })
      .eq("is_approved", false);

    const { count: pendingAdoptions } = await supabase
      .from(ADMIN_TABLES.adoption_requests)
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    counts.pending_vets = pendingVets ?? 0;
    counts.pending_adoptions = pendingAdoptions ?? 0;

    return { ok: true, data: counts };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}
