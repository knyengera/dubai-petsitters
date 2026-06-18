import "server-only";
import { createClient } from "@/lib/supabase/server";

export type HostSeo = {
  id: string;
  full_name: string | null;
  city: string | null;
  neighborhood: string | null;
  services: string[] | null;
  rating: number | null;
  photo_url: string | null;
  updated_at: string | null;
};

export type VetSeo = {
  id: string;
  name: string | null;
  city: string | null;
  address: string | null;
  services: string[] | null;
  rating: number | null;
  image_url: string | null;
  emergency_available: boolean | null;
  updated_at: string | null;
};

export type PetSeo = {
  id: string;
  name: string | null;
  species: string | null;
  breed: string | null;
  description: string | null;
  city: string | null;
  location: string | null;
  image_url: string | null;
  status: string | null;
  updated_at: string | null;
};

export type LostPetSeo = {
  id: string;
  pet_name: string | null;
  species: string | null;
  breed: string | null;
  description: string | null;
  city: string | null;
  last_seen_location: string | null;
  image_url: string | null;
  status: string | null;
  updated_at: string | null;
};

export type SitemapRow = { id: string; updated_at: string | null };

export type ForumTopicUrl = {
  boardSlug: string;
  topicSlug: string;
  updated_at: string | null;
};

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asStringArray(value: unknown): string[] | null {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" ? value : value == null ? null : Number(value);
}

export async function getPublicHostRows(): Promise<SitemapRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pet_hosts")
      .select("id, updated_at")
      .order("updated_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map((row) => ({
      id: String((row as Record<string, unknown>).id),
      updated_at: asString((row as Record<string, unknown>).updated_at),
    }));
  } catch {
    return [];
  }
}

export async function getPublicHostForSeo(id: string): Promise<HostSeo | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pet_hosts")
      .select(
        "id, full_name, city, neighborhood, services, rating, photo_url, updated_at"
      )
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    return {
      id: String(row.id),
      full_name: asString(row.full_name),
      city: asString(row.city),
      neighborhood: asString(row.neighborhood),
      services: asStringArray(row.services),
      rating: asNumber(row.rating),
      photo_url: asString(row.photo_url),
      updated_at: asString(row.updated_at),
    };
  } catch {
    return null;
  }
}

export type CityListItem = { id: string; name: string };

export async function getPublicHostsByCity(
  city: string,
  limit = 12
): Promise<CityListItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pet_hosts")
      .select("id, full_name")
      .eq("city", city)
      .order("rating", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? [])
      .map((row) => {
        const r = row as Record<string, unknown>;
        const name = asString(r.full_name);
        return name ? { id: String(r.id), name } : null;
      })
      .filter((v): v is CityListItem => v !== null);
  } catch {
    return [];
  }
}

export async function getPublicVetsByCity(
  city: string,
  limit = 12
): Promise<CityListItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vet_clinics")
      .select("id, name")
      .eq("is_approved", true)
      .eq("city", city)
      .order("rating", { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? [])
      .map((row) => {
        const r = row as Record<string, unknown>;
        const name = asString(r.name);
        return name ? { id: String(r.id), name } : null;
      })
      .filter((v): v is CityListItem => v !== null);
  } catch {
    return [];
  }
}

export async function getPublicVetRows(): Promise<SitemapRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vet_clinics")
      .select("id, updated_at")
      .eq("is_approved", true)
      .order("updated_at", { ascending: false });
    if (error) return [];
    return (data ?? []).map((row) => ({
      id: String((row as Record<string, unknown>).id),
      updated_at: asString((row as Record<string, unknown>).updated_at),
    }));
  } catch {
    return [];
  }
}

export async function getPublicVetForSeo(id: string): Promise<VetSeo | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vet_clinics")
      .select(
        "id, name, city, address, services, rating, image_url, emergency_available, updated_at"
      )
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    return {
      id: String(row.id),
      name: asString(row.name),
      city: asString(row.city),
      address: asString(row.address),
      services: asStringArray(row.services),
      rating: asNumber(row.rating),
      image_url: asString(row.image_url),
      emergency_available:
        typeof row.emergency_available === "boolean"
          ? row.emergency_available
          : null,
      updated_at: asString(row.updated_at),
    };
  } catch {
    return null;
  }
}

export async function getPublicPetForSeo(id: string): Promise<PetSeo | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pets")
      .select(
        "id, name, species, breed, description, location, image_url, status, updated_at"
      )
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    return {
      id: String(row.id),
      name: asString(row.name),
      species: asString(row.species),
      breed: asString(row.breed),
      description: asString(row.description),
      city: asString(row.location),
      location: asString(row.location),
      image_url: asString(row.image_url),
      status: asString(row.status),
      updated_at: asString(row.updated_at),
    };
  } catch {
    return null;
  }
}

export async function getPublicLostPetForSeo(
  id: string
): Promise<LostPetSeo | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("lost_pets")
      .select(
        "id, pet_name, species, breed, description, city, last_seen_location, image_url, status, updated_at"
      )
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    return {
      id: String(row.id),
      pet_name: asString(row.pet_name),
      species: asString(row.species),
      breed: asString(row.breed),
      description: asString(row.description),
      city: asString(row.city),
      last_seen_location: asString(row.last_seen_location),
      image_url: asString(row.image_url),
      status: asString(row.status),
      updated_at: asString(row.updated_at),
    };
  } catch {
    return null;
  }
}

export type ForumTopicSeo = {
  title: string | null;
  content: string | null;
  boardTitle: string | null;
  boardSlug: string | null;
  updated_at: string | null;
  created_at: string | null;
  author_name: string | null;
};

export async function getPublicForumTopicForSeo(
  boardSlug: string,
  topicSlug: string
): Promise<ForumTopicSeo | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("forum_topics")
      .select(
        "title, content, updated_at, created_at, author_name, moderation_status, board:forum_boards(title, slug)"
      )
      .eq("slug", topicSlug)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as Record<string, unknown>;
    if (row.moderation_status !== "approved") return null;
    const board = row.board as { title?: string; slug?: string } | null;
    if (board?.slug !== boardSlug) return null;
    return {
      title: asString(row.title),
      content: asString(row.content),
      boardTitle: board?.title ?? null,
      boardSlug: board?.slug ?? null,
      updated_at: asString(row.updated_at),
      created_at: asString(row.created_at),
      author_name: asString(row.author_name),
    };
  } catch {
    return null;
  }
}

export async function getPublicForumTopicUrls(): Promise<ForumTopicUrl[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("forum_topics")
      .select("slug, updated_at, board:forum_boards(slug, is_visible)")
      .eq("moderation_status", "approved");
    if (error) return [];
    return (data ?? [])
      .map((row) => {
        const r = row as Record<string, unknown>;
        const board = r.board as { slug?: string; is_visible?: boolean } | null;
        const topicSlug = asString(r.slug);
        if (!board?.slug || !topicSlug || board.is_visible === false) return null;
        return {
          boardSlug: board.slug,
          topicSlug,
          updated_at: asString(r.updated_at),
        };
      })
      .filter((v): v is ForumTopicUrl => v !== null);
  } catch {
    return [];
  }
}
