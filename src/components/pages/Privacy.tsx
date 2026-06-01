"use client";

import React from 'react';

const sections = [
  { title: '1. Information We Collect', body: 'We collect information you provide directly, such as your name, email address, phone number, and pet details when you register, book a service, or contact us. We also collect usage data automatically, including IP addresses, browser type, and pages visited.' },
  { title: '2. How We Use Your Information', body: 'Your information is used to provide, maintain, and improve our services; process bookings and payments; send service-related communications; and comply with legal obligations. We do not sell your personal data to third parties.' },
  { title: '3. Data Sharing', body: 'We may share your information with service providers (hosts, vet clinics) necessary to fulfil a booking, payment processors for secure transactions, and authorities when required by law. All partners are bound by confidentiality agreements.' },
  { title: '4. Cookies', body: 'We use cookies and similar technologies to improve user experience, analyse site traffic, and personalise content. You may disable cookies in your browser settings, though this may affect functionality.' },
  { title: '5. Data Retention', body: 'We retain your personal data for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us.' },
  { title: '6. Your Rights', body: 'You have the right to access, correct, or delete your personal data. To exercise these rights, please contact us at privacy@saudipetsitters.com. We will respond within 30 days.' },
  { title: '7. Security', body: 'We implement industry-standard security measures to protect your data. However, no method of electronic transmission is 100% secure, and we cannot guarantee absolute security.' },
  { title: '8. Changes to This Policy', body: 'We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on our website or sending an email. Continued use of our services constitutes acceptance of the updated policy.' },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="font-heading text-3xl font-extrabold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: May 2026</p>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          Saudi Petsitters ("we", "us", or "our") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform.
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
          For privacy-related enquiries, contact us at <a href="mailto:privacy@saudipetsitters.com" className="text-primary hover:underline">privacy@saudipetsitters.com</a>.
        </div>
      </div>
    </div>
  );
}