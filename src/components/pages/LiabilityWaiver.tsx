"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { CONTACT_PHONE, CONTACT_PHONE_TEL } from "@/lib/seo/site";

const sections = [
  {
    title: "1. Platform Role",
    body: "Dubai Petsitters is a technology platform that connects pet owners with independent pet hosts, veterinarians, and related service providers. We do not directly provide pet care, boarding, walking, or veterinary services. Hosts and service providers are independent parties, not employees or agents of Dubai Petsitters.",
  },
  {
    title: "2. Assumption of Risk",
    body: "You acknowledge that pet care involves inherent risks, including but not limited to injury, illness, death, escape, property damage, allergic reactions, and behavioural incidents. By using the platform, you voluntarily assume all risks associated with arranging, providing, or receiving pet care services through Dubai Petsitters.",
  },
  {
    title: "3. Release and Waiver of Claims",
    body: "To the fullest extent permitted by applicable law, you release, waive, and discharge Dubai Petsitters, its officers, directors, employees, and affiliates from any and all claims, demands, damages, losses, or liabilities — whether direct, indirect, incidental, or consequential — arising from or related to your use of the platform, any booking, pet care arrangement, or interactions with other users or third-party providers.",
  },
  {
    title: "4. Indemnification",
    body: "You agree to indemnify and hold harmless Dubai Petsitters from any claims, damages, losses, costs, or expenses (including reasonable legal fees) arising from your use of the platform, your breach of these agreements, your pet's actions, or any dispute between you and another user or service provider.",
  },
  {
    title: "5. User Responsibilities",
    body: "Pet owners must provide accurate information about their pets, including health conditions, behaviour, and care requirements. Hosts must provide safe, suitable care within their stated capabilities. All users must comply with applicable laws, including animal welfare regulations in the United Arab Emirates. You are responsible for ensuring your pet is vaccinated and fit for the arranged care.",
  },
  {
    title: "6. Veterinary Care",
    body: "In the event of a pet health emergency during a booking, the host or pet owner (as applicable) authorises reasonable veterinary care at the pet owner's expense. Dubai Petsitters is not responsible for veterinary decisions, costs, or outcomes. You agree to maintain adequate pet insurance or accept financial responsibility for veterinary treatment.",
  },
  {
    title: "7. Bookings Between Users",
    body: "When you confirm a booking, you enter into a direct agreement with the other party. Dubai Petsitters facilitates payment processing and communication but is not a party to the care contract. Disputes regarding service quality, cancellations, or refunds must be resolved between the parties, subject to our Terms of Service.",
  },
  {
    title: "8. Governing Law",
    body: "This Liability Waiver is governed by the laws of the United Arab Emirates. Any disputes arising from this waiver shall be subject to the exclusive jurisdiction of the courts of Dubai.",
  },
  {
    title: "9. Severability and Binding Effect",
    body: "If any provision of this waiver is found unenforceable, the remaining provisions shall continue in full force. By creating an account or using Dubai Petsitters, you confirm that you have read, understood, and voluntarily agree to this Liability Waiver.",
  },
];

export default function LiabilityWaiver() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-warning-muted border border-warning-border rounded-2xl p-5 mb-10 text-sm text-warning flex gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            <strong>Important:</strong> This Liability Waiver is a binding agreement. Please read it carefully before creating an account or booking pet care services on Dubai Petsitters.
          </p>
        </div>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          This Liability Waiver outlines the risks associated with using Dubai Petsitters and your agreement to release the platform from certain claims. It must be accepted alongside our Terms of Service and Privacy Policy when you sign up.
        </p>
        <div className="space-y-8">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="font-heading text-lg font-bold text-foreground mb-2">
                {s.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>
        <div className="mt-12 bg-muted rounded-2xl p-6 text-sm text-muted-foreground">
          Questions about this waiver? Contact us at{" "}
          <a href={`tel:${CONTACT_PHONE_TEL}`} className="text-primary hover:underline">
            {CONTACT_PHONE}
          </a>{" "}
          or{" "}
          <a
            href="mailto:legal@dubaipetsitters.com"
            className="text-primary hover:underline"
          >
            legal@dubaipetsitters.com
          </a>
          .
        </div>
      </div>
    </div>
  );
}
