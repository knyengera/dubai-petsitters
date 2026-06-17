import { entities } from "@/lib/data/entities";

export type ContactType = "host" | "vet" | "adoption";

export type ConversationRecord = {
  id: string;
  owner_email: string;
  owner_name?: string;
  contact_id: string;
  contact_name: string;
  contact_type: ContactType;
  contact_email?: string;
  subject?: string;
  last_message?: string;
  last_message_date?: string;
  created_date?: string;
  created_at?: string;
  owner_unread?: number;
  contact_unread?: number;
};

type AuthUser = {
  email: string;
  id?: string;
  full_name?: string;
};

function conversationTimestamp(conv: ConversationRecord): number {
  const raw = conv.last_message_date || conv.created_date || conv.created_at;
  return raw ? new Date(raw).getTime() : 0;
}

function dedupeAndSort(conversations: ConversationRecord[]): ConversationRecord[] {
  const seen = new Map<string, ConversationRecord>();
  for (const conv of conversations) {
    if (!seen.has(conv.id)) seen.set(conv.id, conv);
  }
  return Array.from(seen.values()).sort(
    (a, b) => conversationTimestamp(b) - conversationTimestamp(a)
  );
}

export async function resolveContactEmail(
  contactType: ContactType,
  contactId: string
): Promise<string | null> {
  if (contactType === "host") {
    const host = await entities.PetHost.get(contactId);
    if (!host) return null;
    return (host.created_by as string | undefined) ?? null;
  }

  if (contactType === "adoption") {
    const request = await entities.AdoptionRequest.get(contactId);
    return (request?.applicant_email as string | undefined) ?? null;
  }

  const subs = await entities.VetSubscription.filter(
    { clinic_id: contactId, status: "active" },
    "-updated_date",
    5
  );
  for (const sub of subs) {
    if (sub.created_by) return sub.created_by as string;
    if (sub.contact_email) return sub.contact_email as string;
  }

  const pendingSubs = await entities.VetSubscription.filter(
    { clinic_id: contactId },
    "-updated_date",
    5
  );
  for (const sub of pendingSubs) {
    if (sub.created_by) return sub.created_by as string;
    if (sub.contact_email) return sub.contact_email as string;
  }

  const clinic = await entities.VetClinic.get(contactId);
  return (clinic?.email as string | undefined) ?? null;
}

export async function findOrCreateConversation(input: {
  user: AuthUser;
  contactId: string;
  contactName: string;
  contactType: ContactType;
  subject?: string;
  contactEmail?: string | null;
}): Promise<ConversationRecord> {
  const { user, contactId, contactName, contactType, subject } = input;

  if (contactType === "adoption") {
    return findOrCreateAdoptionConversation(input);
  }

  const contactEmail =
    input.contactEmail ?? (await resolveContactEmail(contactType, contactId));

  const existing = await entities.Conversation.filter({
    owner_email: user.email,
    contact_id: contactId,
    contact_type: contactType,
  });

  if (existing.length > 0) {
    const conv = existing[0] as ConversationRecord;
    if (!conv.contact_email && contactEmail) {
      return entities.Conversation.update(conv.id, {
        contact_email: contactEmail,
      }) as Promise<ConversationRecord>;
    }
    return conv;
  }

  return entities.Conversation.create({
    owner_email: user.email,
    owner_name: user.full_name || user.email,
    contact_id: contactId,
    contact_name: contactName,
    contact_type: contactType,
    contact_email: contactEmail ?? undefined,
    subject: subject || `Question about ${contactName}`,
  }) as Promise<ConversationRecord>;
}

/**
 * Adoption threads are keyed by the adoption request id and have canonical
 * participants (owner = applicant, contact = poster), so the applicant and the
 * pet lister always share a single thread regardless of who starts it.
 */
async function findOrCreateAdoptionConversation(input: {
  user: AuthUser;
  contactId: string;
  subject?: string;
  contactEmail?: string | null;
}): Promise<ConversationRecord> {
  const { contactId, user } = input;

  // Participants are derived authoritatively from the request and pet so the
  // canonical thread is identical regardless of who starts the conversation.
  const request = await entities.AdoptionRequest.get(contactId);
  const applicantEmail = (request?.applicant_email as string | undefined) ?? user.email;
  const applicantName =
    (request?.applicant_name as string | undefined) ?? applicantEmail;

  let posterEmail: string | null = null;
  let petName = "";
  if (request?.pet_id) {
    const pet = await entities.Pet.get(request.pet_id as string);
    posterEmail = (pet?.created_by as string | undefined) ?? null;
    petName = pet?.name ? String(pet.name) : "";
  }

  const existing = await entities.Conversation.filter({
    contact_id: contactId,
    contact_type: "adoption",
  });
  if (existing.length > 0) {
    return existing[0] as ConversationRecord;
  }

  return entities.Conversation.create({
    owner_email: applicantEmail,
    owner_name: applicantName,
    contact_id: contactId,
    contact_name: petName || posterEmail || "Adoption listing",
    contact_type: "adoption",
    contact_email: posterEmail ?? undefined,
    subject:
      input.subject || (petName ? `Adoption inquiry for ${petName}` : "Adoption inquiry"),
  }) as Promise<ConversationRecord>;
}

async function loadConversationsByContactIds(
  contactIds: string[],
  contactType: ContactType
): Promise<ConversationRecord[]> {
  if (contactIds.length === 0) return [];

  const batches = await Promise.all(
    contactIds.map((contactId) =>
      entities.Conversation.filter({ contact_id: contactId, contact_type: contactType })
    )
  );
  return batches.flat() as ConversationRecord[];
}

export async function loadUserConversations(
  user: AuthUser
): Promise<ConversationRecord[]> {
  const [asOwner, asContactByEmail, hostsByEmail, vetSubs, postedPets] = await Promise.all([
    entities.Conversation.filter({ owner_email: user.email }, "-last_message_date", 50),
    entities.Conversation.filter({ contact_email: user.email }, "-last_message_date", 50),
    entities.PetHost.filter({ created_by: user.email }),
    entities.VetSubscription.filter({ created_by: user.email }),
    entities.Pet.filter({ created_by: user.email }),
  ]);

  const hostsByUserId = user.id
    ? await entities.PetHost.filter({ user_id: user.id })
    : [];

  const hostIdSet = new Set<string>();
  for (const host of [...hostsByEmail, ...hostsByUserId]) {
    if (host.id) hostIdSet.add(host.id as string);
  }

  const clinicIdSet = new Set(
    vetSubs.map((s) => s.clinic_id as string).filter(Boolean)
  );

  const postedPetIds = postedPets.map((p) => p.id as string).filter(Boolean);
  const adoptionRequests = postedPetIds.length
    ? (
        await Promise.all(
          postedPetIds.map((petId) => entities.AdoptionRequest.filter({ pet_id: petId }))
        )
      ).flat()
    : [];
  const adoptionRequestIdSet = new Set(
    adoptionRequests.map((r) => r.id as string).filter(Boolean)
  );

  const [asHostContact, asVetContact, asAdoptionContact] = await Promise.all([
    loadConversationsByContactIds(Array.from(hostIdSet), "host"),
    loadConversationsByContactIds(Array.from(clinicIdSet), "vet"),
    loadConversationsByContactIds(Array.from(adoptionRequestIdSet), "adoption"),
  ]);

  return dedupeAndSort([
    ...(asOwner as ConversationRecord[]),
    ...(asContactByEmail as ConversationRecord[]),
    ...asHostContact,
    ...asVetContact,
    ...asAdoptionContact,
  ]);
}
