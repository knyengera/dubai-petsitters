import { createEntityClient } from "./entity-client";

/** Drop-in replacement for `base44.entities.*` using Supabase tables. */
export const entities = {
  Pet: createEntityClient("pets"),
  PetHost: createEntityClient("pet_hosts"),
  UserPet: createEntityClient("user_pets"),
  VetClinic: createEntityClient("vet_clinics"),
  HostingBooking: createEntityClient("hosting_bookings"),
  Appointment: createEntityClient("appointments"),
  Conversation: createEntityClient("conversations"),
  Message: createEntityClient("messages"),
  ForumThread: createEntityClient("forum_threads"),
  ForumComment: createEntityClient("forum_comments"),
  BlogPost: createEntityClient("blog_posts"),
  BlogComment: createEntityClient("blog_comments"),
  LostPet: createEntityClient("lost_pets"),
  MedicalRecord: createEntityClient("medical_records"),
  Vaccination: createEntityClient("vaccinations"),
  AdoptionRequest: createEntityClient("adoption_requests"),
  Payment: createEntityClient("payments"),
  PartnerDeal: createEntityClient("partner_deals"),
  PartnerInquiry: createEntityClient("partner_inquiries"),
  HostAvailability: createEntityClient("host_availability"),
  VetSubscription: createEntityClient("vet_subscriptions"),
  Review: createEntityClient("reviews"),
};
