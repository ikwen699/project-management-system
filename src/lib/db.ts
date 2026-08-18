import { supabase } from "./supabase";

export { supabase };

export async function query<T = any>(
  table: string,
  options?: {
    select?: string;
    filters?: Record<string, any>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
  }
): Promise<T[]> {
  let builder = supabase.from(table).select(options?.select || "*");

  if (options?.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      if (value !== undefined && value !== null) {
        builder = builder.eq(key, value);
      }
    }
  }

  if (options?.order) {
    builder = builder.order(options.order.column, {
      ascending: options.order.ascending ?? true,
    });
  }

  if (options?.limit) {
    builder = builder.limit(options.limit);
  }

  const { data, error } = await builder;
  if (error) throw error;
  return (data || []) as T[];
}

export async function queryOne<T = any>(
  table: string,
  options?: {
    select?: string;
    filters?: Record<string, any>;
  }
): Promise<T | null> {
  let builder = supabase.from(table).select(options?.select || "*");

  if (options?.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      if (value !== undefined && value !== null) {
        builder = builder.eq(key, value);
      }
    }
  }

  const { data, error } = await builder.single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as T;
}

export async function insert<T = any>(
  table: string,
  record: Record<string, any>
): Promise<T> {
  const { data, error } = await supabase
    .from(table)
    .insert(record)
    .select()
    .single();
  if (error) throw error;
  return data as T;
}

export async function insertMany<T = any>(
  table: string,
  records: Record<string, any>[]
): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .insert(records)
    .select();
  if (error) throw error;
  return (data || []) as T[];
}

export async function update<T = any>(
  table: string,
  updates: Record<string, any>,
  filters: Record<string, any>
): Promise<T | null> {
  let builder = supabase.from(table).update(updates);

  for (const [key, value] of Object.entries(filters)) {
    builder = builder.eq(key, value);
  }

  const { data, error } = await builder.select().single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as T;
}

export async function remove(
  table: string,
  filters: Record<string, any>
): Promise<void> {
  let builder = supabase.from(table).delete();

  for (const [key, value] of Object.entries(filters)) {
    builder = builder.eq(key, value);
  }

  const { error } = await builder;
  if (error) throw error;
}

export async function rpc<T = any>(
  fn: string,
  params?: Record<string, any>
): Promise<T> {
  const { data, error } = await supabase.rpc(fn, params || {});
  if (error) throw error;
  return data as T;
}
