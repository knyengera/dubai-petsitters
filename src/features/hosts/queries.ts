import { entities } from "@/lib/data/entities";

export const hostsQueries = {
  list: (order = "-rating") => entities.PetHost.list(order),
  listAvailable: (order = "-rating") =>
    entities.PetHost.filter({ is_available: true }, order),
  get: (id: string) => entities.PetHost.get(id),
  byOwner: (email: string) => entities.PetHost.filter({ created_by: email }),
};
