"use client";

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_TEL } from '@/lib/seo/site';

const sections = [
  { title: 'General Information Only', body: 'The content on Dubai Petsitters — including blog posts, forum discussions, AI pet care guidance, and vet profiles — is provided for general informational purposes only. It does not constitute professional veterinary, medical, or legal advice.' },
  { title: 'No Veterinary Advice', body: 'Nothing on this platform should be interpreted as a substitute for professional veterinary consultation. Always seek the advice of a qualified veterinarian regarding any questions you may have about your pet\'s health, diagnosis, or treatment.' },
  { title: 'AI-Generated Content', body: 'Our AI Pet Care Assistant and AI-assisted features provide general guidance only. AI responses may not always be accurate, complete, or applicable to your pet\'s specific situation. Do not rely solely on AI-generated content for health or travel decisions.' },
  { title: 'Third-Party Services', body: 'Dubai Petsitters links to and lists third-party services including vet clinics, pet hosts, and partner businesses. We do not endorse, warrant, or assume responsibility for the services, content, or practices of any third-party providers.' },
  { title: 'User-Generated Content', body: 'Reviews, forum posts, and other user-generated content represent the opinions of individual users and not Dubai Petsitters. We do not verify the accuracy of user-submitted information and disclaim liability for reliance on such content.' },
  { title: 'Limitation of Liability', body: 'To the maximum extent permitted by applicable law, Dubai Petsitters disclaims all liability for any loss or damage — including direct, indirect, incidental, or consequential — arising from your use of or reliance on any content or services on the platform.' },
  { title: 'External Links', body: 'Our platform may contain links to external websites. These links are provided for convenience only. Dubai Petsitters has no control over the content of external sites and accepts no responsibility for them or for any loss or damage that may arise from your use of them.' },
];

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-warning-muted border border-warning-border rounded-2xl p-5 mb-10 text-sm text-warning">
          <strong>Important:</strong> The information on Dubai Petsitters is not a substitute for professional veterinary advice. When in doubt, always consult a qualified vet.
        </div>
        <div className="space-y-8">
          {sections.map(s => (
            <section key={s.title}>
              <h2 className="font-heading text-lg font-bold text-foreground mb-2">{s.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>
        <div className="mt-12 bg-muted rounded-2xl p-6 text-sm text-muted-foreground">
          If you have concerns about content accuracy, please contact us at{" "}
          <a href={`tel:${CONTACT_PHONE_TEL}`} className="text-primary hover:underline">{CONTACT_PHONE}</a>
          {" "}or{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
        </div>
      </div>
    </div>
  );
}