import { entities } from "@/lib/data/entities";

export const petsQueries = {
  listAvailable: (limit = 50) =>
    entities.Pet.filter({ status: "available" }, "-created_at", limit),
  get: (id: string) => entities.Pet.get(id),
  userPets: (order = "-created_at") => entities.UserPet.list(order, 50),
  getUserPet: (id: string) => entities.UserPet.get(id),
};
