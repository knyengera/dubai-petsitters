import type { BookingPetValue } from "@/components/hosting/BookingPetField";

export type HostBookingDraft = {
  hostId: string;
  service_type: string;
  start_date: string;
  end_date: string;
  pet: BookingPetValue;
};

export function hostBookingDraftKey(hostId: string): string {
  return `host-booking-draft:${hostId}`;
}

export function saveHostBookingDraft(draft: HostBookingDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(hostBookingDraftKey(draft.hostId), JSON.stringify(draft));
}

export function loadHostBookingDraft(hostId: string): HostBookingDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(hostBookingDraftKey(hostId));
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as HostBookingDraft;
    if (draft.hostId !== hostId) return null;
    return draft;
  } catch {
    return null;
  }
}

export function clearHostBookingDraft(hostId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(hostBookingDraftKey(hostId));
}
