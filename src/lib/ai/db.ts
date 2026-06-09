import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Row = Record<string, unknown>;

type AiTableQuery = {
  select: (columns?: string) => AiTableQuery;
  insert: (payload: Row | Row[]) => AiTableQuery;
  update: (payload: Row) => AiTableQuery;
  eq: (column: string, value: string) => AiTableQuery;
  order: (column: string, options: { ascending: boolean }) => AiTableQuery;
  limit: (count: number) => AiTableQuery;
  maybeSingle: () => Promise<{ data: Row | null; error: { message: string } | null }>;
  single: () => Promise<{ data: Row | null; error: { message: string } | null }>;
  then: (
    onfulfilled?: (value: { data: Row[] | null; error: { message: string } | null }) => unknown
  ) => Promise<{ data: Row[] | null; error: { message: string } | null }>;
};

export function aiTable(
  supabase: SupabaseClient<Database>,
  table: "ai_assistant_conversations" | "ai_assistant_messages"
): AiTableQuery {
  return supabase.from(table) as unknown as AiTableQuery;
}
