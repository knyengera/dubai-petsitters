import { createClient } from "@/lib/supabase/client";

type Row = Record<string, unknown>;

function parseOrder(order?: string): { column: string; ascending: boolean } | null {
  if (!order) return null;
  const desc = order.startsWith("-");
  const column = desc ? order.slice(1) : order;
  const mapped =
    column === "created_date" ? "created_at" : column === "updated_date" ? "updated_at" : column;
  return { column: mapped, ascending: !desc };
}

export function createEntityClient<T extends Row>(table: string) {
  const supabase = () => createClient();

  return {
    async list(order?: string, limit?: number): Promise<T[]> {
      let query = supabase().from(table).select("*");
      const o = parseOrder(order);
      if (o) query = query.order(o.column, { ascending: o.ascending });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) {
        console.warn(`[${table}.list]`, error.message);
        return [];
      }
      return (data ?? []) as T[];
    },

    async get(id: string): Promise<T | null> {
      const { data, error } = await supabase()
        .from(table)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        console.warn(`[${table}.get]`, error.message);
        return null;
      }
      return data as T | null;
    },

    async filter(
      filters: Partial<T>,
      order?: string,
      limit?: number
    ): Promise<T[]> {
      let query = supabase().from(table).select("*");
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value as string | number | boolean);
        }
      });
      const o = parseOrder(order);
      if (o) query = query.order(o.column, { ascending: o.ascending });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) {
        console.warn(`[${table}.filter]`, error.message);
        return [];
      }
      return (data ?? []) as T[];
    },

    async create(payload: Partial<T>): Promise<T> {
      const { data, error } = await supabase()
        .from(table)
        .insert(payload as Row)
        .select()
        .single();
      if (error) throw error;
      return data as T;
    },

    async update(id: string, payload: Partial<T>): Promise<T> {
      const { data, error } = await supabase()
        .from(table)
        .update(payload as Row)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as T;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase().from(table).delete().eq("id", id);
      if (error) throw error;
    },

    /** Realtime subscription — refreshes on any change to the table. */
    subscribe(callback: (event: { type: string }) => void): () => void {
      const client = supabase();
      const channel = client
        .channel(`${table}-changes`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => callback({ type: "change" })
        )
        .subscribe();
      return () => {
        client.removeChannel(channel);
      };
    },
  };
}
