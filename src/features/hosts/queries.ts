import { entities } from "@/lib/data/entities";

export const hostsQueries = {
  list: (order = "-rating") => entities.PetHost.list(order),
  listAvailable: (order = "-rating") =>
    entities.PetHost.filter({ is_available: true }, order),
  get: (id: string) => entities.PetHost.get(id),
  byOwner: (email: string) => entities.PetHost.filter({ created_by: email }),
  async forUser(user: { id: string; email: string }) {
    const byEmail = await entities.PetHost.filter({ created_by: user.email });
    if (byEmail.length > 0) return byEmail[0];
    const byUserId = await entities.PetHost.filter({ user_id: user.id });
    return byUserId[0] ?? null;
  },
};
