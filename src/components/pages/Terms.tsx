"use client";

import React from 'react';

const sections = [
  { title: '1. Acceptance of Terms', body: 'By creating an account, signing up, or using Saudi Petsitters, you agree to be bound by these Terms and Conditions, our Privacy Policy, and our Liability Waiver. Your acceptance is recorded at registration. If you do not agree, please discontinue use of the platform immediately.' },
  { title: '2. Use of the Platform', body: 'You may use Saudi Petsitters solely for lawful purposes. You agree not to misuse the platform, post false information, harass other users, or attempt to gain unauthorised access to any part of the service.' },
  { title: '3. User Accounts', body: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorised use of your account. Saudi Petsitters is not liable for losses resulting from unauthorised account use.' },
  { title: '4. Pet Hosting Services', body: 'Saudi Petsitters acts as an intermediary connecting pet owners with independent hosts. We do not directly provide pet care services. Hosts are independent contractors and not employees of Saudi Petsitters. We are not liable for the actions or omissions of hosts.' },
  { title: '5. Payments and Fees', body: 'All fees are displayed clearly before booking confirmation. Payments are processed by third-party gateways. Refund and cancellation policies are governed by the terms agreed at the time of booking.' },
  { title: '6. Listings and Content', body: 'Users may post listings, reviews, and forum content. You retain ownership of your content but grant Saudi Petsitters a licence to display it on the platform. We reserve the right to remove content that violates these Terms.' },
  { title: '7. Intellectual Property', body: 'All platform content, design, and trademarks are the property of Saudi Petsitters. You may not reproduce, distribute, or create derivative works without prior written consent.' },
  { title: '8. Limitation of Liability', body: 'Saudi Petsitters shall not be liable for indirect, incidental, or consequential damages arising from your use of the platform. Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.' },
  { title: '9. Governing Law', body: 'These Terms are governed by the laws of the Kingdom of Saudi Arabia. Any disputes shall be subject to the exclusive jurisdiction of the courts of Riyadh.' },
  { title: '10. Modifications', body: 'We reserve the right to modify these Terms at any time. Continued use of the platform after changes are posted constitutes acceptance of the revised Terms.' },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <p className="text-muted-foreground mb-10 leading-relaxed">
          Please read these Terms and Conditions carefully before using the Saudi Petsitters platform. These Terms govern your use of our website and services.
        </p>
        <div className="space-y-8">
          {sections.map(s => (
            <section key={s.title}>
              <h2 className="font-heading text-lg font-bold text-foreground mb-2">{s.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>
        <div className="mt-12 bg-muted rounded-2xl p-6 text-sm text-muted-foreground">
          Questions about these Terms? Contact us at <a href="mailto:legal@saudipetsitters.com" className="text-primary hover:underline">legal@saudipetsitters.com</a>.
        </div>
      </div>
    </div>
  );
}