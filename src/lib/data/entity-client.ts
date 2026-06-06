import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

type Row = Record<string, unknown>;
type TableName = Extract<keyof Database["public"]["Tables"], string>;
type EntityError = { message?: string };
type QueryResult<R> = PromiseLike<{ data: R; error: EntityError | null }>;
type DynamicQuery = QueryResult<Row[] | null> & {
  select: (columns?: string) => DynamicQuery;
  order: (column: string, options: { ascending: boolean }) => DynamicQuery;
  limit: (count: number) => DynamicQuery;
  eq: (column: string, value: string | number | boolean) => DynamicQuery;
  maybeSingle: () => QueryResult<Row | null>;
  single: () => QueryResult<Row | null>;
  insert: (payload: Row) => DynamicQuery;
  update: (payload: Row) => DynamicQuery;
  delete: () => DynamicQuery;
};

function toEntityError(table: string, operation: string, error: EntityError) {
  const message = error.message || `${table}.${operation} failed`;
  const entityError = new Error(message);
  (entityError as Error & { cause?: unknown }).cause = error;
  return entityError;
}

function fromTable(table: TableName): DynamicQuery {
  return createClient().from(table) as unknown as DynamicQuery;
}

function parseOrder(order?: string): { column: string; ascending: boolean } | null {
  if (!order) return null;
  const desc = order.startsWith("-");
  const column = desc ? order.slice(1) : order;
  const mapped =
    column === "created_date" ? "created_at" : column === "updated_date" ? "updated_at" : column;
  return { column: mapped, ascending: !desc };
}

function normalizeRow<T extends Row>(row: Row | null): T | null {
  if (!row) return null;
  return {
    ...row,
    created_date: row.created_date ?? row.created_at,
    updated_date: row.updated_date ?? row.updated_at,
  } as unknown as T;
}

function normalizeRows<T extends Row>(rows: Row[] | null): T[] {
  return (rows ?? []).map((row) => normalizeRow<T>(row) as T);
}

export function createEntityClient<T extends Row>(table: TableName) {
  return {
    async list(order?: string, limit?: number): Promise<T[]> {
      let query = fromTable(table).select("*");
      const o = parseOrder(order);
      if (o) query = query.order(o.column, { ascending: o.ascending });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) {
        console.warn(`[${table}.list]`, error.message);
        return [];
      }
      return normalizeRows<T>(data);
    },

    async get(id: string): Promise<T | null> {
      const { data, error } = await fromTable(table)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        console.warn(`[${table}.get]`, error.message);
        return null;
      }
      return normalizeRow<T>(data);
    },

    async filter(
      filters: Partial<T>,
      order?: string,
      limit?: number
    ): Promise<T[]> {
      let query = fromTable(table).select("*");
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
      return normalizeRows<T>(data);
    },

    async create(payload: Partial<T>): Promise<T> {
      const { data, error } = await fromTable(table)
        .insert(payload as Row)
        .select()
        .single();
      if (error) throw toEntityError(table, "create", error);
      return normalizeRow<T>(data) as T;
    },

    async update(id: string, payload: Partial<T>): Promise<T> {
      const { data, error } = await fromTable(table)
        .update(payload as Row)
        .eq("id", id)
        .select()
        .single();
      if (error) throw toEntityError(table, "update", error);
      return normalizeRow<T>(data) as T;
    },

    async delete(id: string): Promise<void> {
      const { error } = await fromTable(table).delete().eq("id", id);
      if (error) throw toEntityError(table, "delete", error);
    },

    /** Realtime subscription — refreshes on any change to the table. */
    subscribe(callback: (event: { type: string }) => void): () => void {
      const client = createClient();
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
