import { entities } from "@/lib/data/entities";

export const vetsQueries = {
  list: (order = "-rating") => entities.VetClinic.list(order),
  featured: (limit = 5) =>
    entities.VetClinic.filter({ is_featured: true }, "-rating", limit),
  get: (id: string) => entities.VetClinic.get(id),
};
