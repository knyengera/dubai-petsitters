import { formatTravelKnowledgeForPrompt } from "@/lib/ai/travel-knowledge";

export function getTravelPrompt(): string {
  return `Topic focus: PET TRAVEL COMPLIANCE (UAE import/export)

Provide guidance on:
- Importing pets into the UAE (MOCCAE permits, health certificates, microchip, rabies vaccination, UAE Pass verification)
- Exporting pets from the UAE to common destinations
- Required documents, timelines, and advance planning
- Species-specific requirements (dog, cat, bird)
- Airline pet travel basics (carrier requirements, sedation warnings — generally avoid sedation unless vet-approved)
- Quarantine and banned species considerations

Important disclaimers to include when relevant:
- Regulations change — always verify with MOCCAE and destination country authorities before travel
- Health certificates typically must be issued within 10 days of travel
- ISO 11784/11785 microchips are standard for dogs and cats

Reference knowledge (use as guidance, not legal advice):
${formatTravelKnowledgeForPrompt()}`;
}
