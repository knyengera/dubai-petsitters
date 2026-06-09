import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type PetSummary = {
  name: string;
  species: string;
  breed: string | null;
  age: string | null;
  weight_kg: number | null;
};

export async function fetchPetContext(
  supabase: SupabaseClient<Database>,
  userEmail: string
): Promise<string | undefined> {
  const { data } = await supabase
    .from("user_pets")
    .select("name, species, breed, age, weight_kg")
    .eq("created_by", userEmail)
    .limit(5);

  const pets = data as PetSummary[] | null;
  if (!pets?.length) return undefined;

  return pets
    .map((pet) => {
      const parts = [
        pet.name,
        pet.species,
        pet.breed,
        pet.age ? `age ${pet.age}` : null,
        pet.weight_kg ? `${pet.weight_kg}kg` : null,
      ].filter(Boolean);
      return `- ${parts.join(", ")}`;
    })
    .join("\n");
}
