import { getAppBaseUrl } from "@/lib/notifications/config";
import {
  buildBrandedEmail,
  emailDetailTable,
  emailParagraph,
  emailQuote,
  escapeHtml,
} from "@/lib/notifications/email-layout";
import type { NotificationChannel, RenderedNotification } from "@/lib/notifications/types";

function link(path: string): string {
  return `${getAppBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function str(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  return String(value);
}

function brandedHtml(
  title: string,
  bodyHtml: string,
  options?: {
    preheader?: string;
    cta?: { label: string; href: string };
    showLinkFallback?: boolean;
  }
): string {
  return buildBrandedEmail({
    title,
    bodyHtml,
    preheader: options?.preheader,
    cta: options?.cta,
    showLinkFallback: options?.showLinkFallback,
  });
}

export function renderNotification(
  templateKey: string,
  channel: NotificationChannel,
  payload: Record<string, unknown>
): RenderedNotification {
  const renderer = TEMPLATES[templateKey] ?? TEMPLATES["generic"];
  return renderer(channel, payload);
}

export type InAppNotificationContent = {
  title: string;
  body: string;
  actionUrl: string;
};

export function renderInAppNotification(
  templateKey: string,
  payload: Record<string, unknown>
): InAppNotificationContent {
  const renderer = IN_APP_TEMPLATES[templateKey] ?? IN_APP_TEMPLATES.generic;
  return renderer(payload);
}

type InAppTemplateFn = (payload: Record<string, unknown>) => InAppNotificationContent;

const IN_APP_TEMPLATES: Record<string, InAppTemplateFn> = {
  "booking.request": (p) => {
    const owner = str(p.owner_name, "A pet owner");
    const pet = str(p.pet_name, "a pet");
    const dates = [p.start_date, p.end_date].filter(Boolean).join(" – ");
    return {
      title: `New booking request for ${pet}`,
      body: `${owner} requested hosting for ${pet}${dates ? ` (${dates})` : ""}.`,
      actionUrl: "/host-calendar",
    };
  },
  "booking.confirmed": (p) => {
    const pet = str(p.pet_name, "your pet");
    return {
      title: `Booking confirmed — ${pet}`,
      body: `Your hosting booking for ${pet} is confirmed.`,
      actionUrl: "/my-appointments",
    };
  },
  "booking.confirmed.host": (p) => {
    const pet = str(p.pet_name, "a pet");
    const owner = str(p.owner_name, "the owner");
    return {
      title: `Booking confirmed — ${pet}`,
      body: `${owner}'s booking for ${pet} is confirmed and payment has been received.`,
      actionUrl: "/host-calendar",
    };
  },
  "payment.confirmed": (p) => {
    const amount = str(p.amount);
    const currency = str(p.currency, "USD");
    return {
      title: "Payment confirmed",
      body: `Payment of ${amount} ${currency} received. Thank you!`,
      actionUrl: "/dashboard",
    };
  },
  "message.new": (p) => {
    const sender = str(p.sender_name, "Someone");
    const preview = str(p.preview);
    const convId = str(p.conversation_id);
    return {
      title: `New message from ${sender}`,
      body: preview ? `"${preview}"` : "You have a new message.",
      actionUrl: convId ? `/messages?id=${convId}` : "/messages",
    };
  },
  "appointment.request": (p) => {
    const pet = str(p.pet_name, "your pet");
    const clinic = str(p.clinic_name, "the clinic");
    return {
      title: "Appointment request received",
      body: `Appointment request submitted for ${pet} at ${clinic}. We'll notify you when it's reviewed.`,
      actionUrl: "/my-appointments",
    };
  },
  "appointment.status": (p) => {
    const status = str(p.status);
    const pet = str(p.pet_name, "your pet");
    return {
      title: `Appointment ${status}`,
      body: `Your appointment for ${pet} is now ${status}.`,
      actionUrl: "/my-appointments",
    };
  },
  "adoption.received": (p) => {
    const pet = str(p.pet_name, "your pet");
    const applicant = str(p.applicant_name, "Someone");
    return {
      title: `Adoption request for ${pet}`,
      body: `${applicant} applied to adopt ${pet}.`,
      actionUrl: "/dashboard",
    };
  },
  "payout.status": (p) => {
    const status = str(p.status);
    const amount = str(p.net_amount);
    const currency = str(p.currency, "USD");
    return {
      title: `Payout ${status}`,
      body: `Payout ${status}: ${amount} ${currency}.`,
      actionUrl: "/dashboard",
    };
  },
  "escrow.released": (p) => {
    const amount = str(p.host_earnings);
    const currency = str(p.currency, "USD");
    const pet = str(p.pet_name, "booking");
    return {
      title: "Earnings released",
      body: `Earnings of ${amount} ${currency} released for ${pet}.`,
      actionUrl: "/host-calendar",
    };
  },
  "reminder.pet_health": (p) => {
    const pet = str(p.pet_name, "your pet");
    const vaccine = str(p.vaccine_name, "vaccination");
    const due = str(p.due_date);
    return {
      title: `${pet} health reminder`,
      body: `Reminder: ${pet}'s ${vaccine} is due on ${due}.`,
      actionUrl: "/dashboard",
    };
  },
  generic: (p) => ({
    title: "Notification",
    body: str(p.text, "You have a new notification from Saudi Petsitters."),
    actionUrl: "/dashboard",
  }),
};

type TemplateFn = (channel: NotificationChannel, payload: Record<string, unknown>) => RenderedNotification;

const TEMPLATES: Record<string, TemplateFn> = {
  "booking.request": (channel, p) => {
    const owner = str(p.owner_name, "A pet owner");
    const pet = str(p.pet_name, "a pet");
    const dates = [p.start_date, p.end_date].filter(Boolean).join(" – ");
    const calendarUrl = link("/host-calendar");
    const text = `New booking request from ${owner} for ${pet}${dates ? ` (${dates})` : ""}. View: ${calendarUrl}`;
    if (channel === "sms") return { text };
    return {
      subject: `New booking request for ${pet}`,
      text,
      html: brandedHtml(
        "New booking request",
        [
          emailParagraph(
            `<strong>${escapeHtml(owner)}</strong> requested hosting for <strong>${escapeHtml(pet)}</strong>.`
          ),
          emailDetailTable([
            { label: "Pet", value: pet },
            { label: "Owner", value: owner },
            { label: "Dates", value: dates },
            { label: "Service", value: str(p.service_type) },
          ]),
        ].join(""),
        {
          preheader: `${owner} wants to book hosting for ${pet}`,
          cta: { label: "View calendar", href: calendarUrl },
        }
      ),
    };
  },

  "booking.confirmed": (channel, p) => {
    const pet = str(p.pet_name, "your pet");
    const detailsUrl = link("/my-appointments");
    const text = `Your booking for ${pet} is confirmed. Details: ${detailsUrl}`;
    if (channel === "sms") return { text };
    return {
      subject: `Booking confirmed — ${pet}`,
      text,
      html: brandedHtml(
        "Booking confirmed",
        [
          emailParagraph(
            `Great news! Your hosting booking for <strong>${escapeHtml(pet)}</strong> is confirmed.`
          ),
          emailDetailTable([
            { label: "Pet", value: pet },
            { label: "Start", value: str(p.start_date) },
            { label: "End", value: str(p.end_date) },
            { label: "Total", value: p.total_price ? `${p.total_price} USD` : "" },
          ]),
        ].join(""),
        {
          preheader: `Your booking for ${pet} is confirmed`,
          cta: { label: "View booking", href: detailsUrl },
        }
      ),
    };
  },

  "booking.confirmed.host": (channel, p) => {
    const pet = str(p.pet_name, "a pet");
    const owner = str(p.owner_name, "the owner");
    const calendarUrl = link("/host-calendar");
    const text = `Booking confirmed: ${owner}'s ${pet}. ${calendarUrl}`;
    if (channel === "sms") return { text };
    return {
      subject: `Booking confirmed — ${pet}`,
      text,
      html: brandedHtml(
        "Booking confirmed & paid",
        [
          emailParagraph(
            `<strong>${escapeHtml(owner)}</strong>&rsquo;s booking for <strong>${escapeHtml(pet)}</strong> is confirmed and payment has been received.`
          ),
          emailDetailTable([
            { label: "Pet", value: pet },
            { label: "Owner", value: owner },
            { label: "Dates", value: [p.start_date, p.end_date].filter(Boolean).join(" – ") },
          ]),
        ].join(""),
        {
          preheader: `Paid booking confirmed for ${pet}`,
          cta: { label: "Open host calendar", href: calendarUrl },
        }
      ),
    };
  },

  "payment.confirmed": (channel, p) => {
    const amount = str(p.amount);
    const currency = str(p.currency, "USD");
    const text = `Payment of ${amount} ${currency} received. Thank you!`;
    if (channel === "sms") return { text };
    return {
      subject: "Payment confirmed",
      text,
      html: brandedHtml(
        "Payment confirmed",
        [
          emailParagraph("Thank you! We&rsquo;ve received your payment."),
          emailDetailTable([
            { label: "Amount", value: `${amount} ${currency}` },
            { label: "Reference", value: str(p.payment_id) },
          ]),
        ].join(""),
        { preheader: `Payment of ${amount} ${currency} confirmed` }
      ),
    };
  },

  "message.new": (channel, p) => {
    const sender = str(p.sender_name, "Someone");
    const preview = str(p.preview);
    const convId = str(p.conversation_id);
    const messagesUrl = link(`/messages?id=${convId}`);
    const text = `New message from ${sender}: "${preview}". Reply: ${messagesUrl}`;
    if (channel === "sms") return { text: `New message from ${sender}. ${messagesUrl}` };
    return {
      subject: `New message from ${sender}`,
      text,
      html: brandedHtml(
        `Message from ${sender}`,
        [
          emailParagraph(
            `<strong>${escapeHtml(sender)}</strong> sent you a message:`
          ),
          emailQuote(preview),
        ].join(""),
        {
          preheader: `${sender}: ${preview.slice(0, 80)}`,
          cta: { label: "Reply in app", href: messagesUrl },
        }
      ),
    };
  },

  "appointment.request": (channel, p) => {
    const pet = str(p.pet_name, "your pet");
    const clinic = str(p.clinic_name, "the clinic");
    const appointmentsUrl = link("/my-appointments");
    const text = `Appointment request submitted for ${pet} at ${clinic}. We'll notify you when it's reviewed.`;
    if (channel === "sms") return { text };
    return {
      subject: "Appointment request received",
      text,
      html: brandedHtml(
        "Appointment request received",
        [
          emailParagraph("We&rsquo;ve received your appointment request and will notify you once it&rsquo;s reviewed."),
          emailDetailTable([
            { label: "Pet", value: pet },
            { label: "Clinic", value: clinic },
            { label: "Vet", value: str(p.vet_name) },
            { label: "Date", value: str(p.date) },
            { label: "Time", value: str(p.time) },
          ]),
        ].join(""),
        {
          preheader: `Appointment request for ${pet}`,
          cta: { label: "View appointments", href: appointmentsUrl },
        }
      ),
    };
  },

  "appointment.status": (channel, p) => {
    const status = str(p.status);
    const pet = str(p.pet_name, "your pet");
    const appointmentsUrl = link("/my-appointments");
    const text = `Appointment for ${pet} is now ${status}. ${appointmentsUrl}`;
    if (channel === "sms") return { text };
    return {
      subject: `Appointment ${status}`,
      text,
      html: brandedHtml(
        `Appointment ${status}`,
        [
          emailParagraph(
            `Your appointment for <strong>${escapeHtml(pet)}</strong> is now <strong>${escapeHtml(status)}</strong>.`
          ),
          emailDetailTable([
            { label: "Pet", value: pet },
            { label: "Clinic", value: str(p.clinic_name) },
            { label: "Date", value: str(p.date) },
            { label: "Status", value: status },
          ]),
        ].join(""),
        {
          preheader: `${pet} appointment is ${status}`,
          cta: { label: "View details", href: appointmentsUrl },
        }
      ),
    };
  },

  "adoption.received": (channel, p) => {
    const pet = str(p.pet_name, "your pet");
    const applicant = str(p.applicant_name, "Someone");
    const text = `New adoption request for ${pet} from ${applicant}.`;
    if (channel === "sms") return { text };
    return {
      subject: `Adoption request for ${pet}`,
      text,
      html: brandedHtml(
        "New adoption request",
        [
          emailParagraph(
            `<strong>${escapeHtml(applicant)}</strong> applied to adopt <strong>${escapeHtml(pet)}</strong>.`
          ),
          p.message ? emailQuote(str(p.message)) : "",
        ].join(""),
        { preheader: `${applicant} wants to adopt ${pet}` }
      ),
    };
  },

  "payout.status": (channel, p) => {
    const status = str(p.status);
    const amount = str(p.net_amount);
    const currency = str(p.currency, "USD");
    const text = `Payout ${status}: ${amount} ${currency}.`;
    if (channel === "sms") return { text };
    return {
      subject: `Payout ${status}`,
      text,
      html: brandedHtml(
        `Payout ${status}`,
        [
          emailParagraph("Here&rsquo;s an update on your payout request:"),
          emailDetailTable([
            { label: "Status", value: status },
            { label: "Net amount", value: `${amount} ${currency}` },
          ]),
        ].join(""),
        { preheader: `Payout ${status}: ${amount} ${currency}` }
      ),
    };
  },

  "escrow.released": (channel, p) => {
    const amount = str(p.host_earnings);
    const currency = str(p.currency, "USD");
    const pet = str(p.pet_name, "booking");
    const calendarUrl = link("/host-calendar");
    const text = `Earnings of ${amount} ${currency} released for ${pet}.`;
    if (channel === "sms") return { text };
    return {
      subject: "Earnings released",
      text,
      html: brandedHtml(
        "Earnings released",
        [
          emailParagraph(
            `Funds from the <strong>${escapeHtml(pet)}</strong> booking have been released to your balance.`
          ),
          emailDetailTable([
            { label: "Amount", value: `${amount} ${currency}` },
            { label: "Booking", value: pet },
          ]),
        ].join(""),
        {
          preheader: `${amount} ${currency} released to your balance`,
          cta: { label: "View host dashboard", href: calendarUrl },
        }
      ),
    };
  },

  "reminder.pet_health": (channel, p) => {
    const pet = str(p.pet_name, "your pet");
    const vaccine = str(p.vaccine_name, "vaccination");
    const due = str(p.due_date);
    const dashboardUrl = link("/dashboard");
    const text = `Reminder: ${pet}'s ${vaccine} is due on ${due}.`;
    if (channel === "sms") return { text };
    return {
      subject: `${pet} health reminder`,
      text,
      html: brandedHtml(
        "Pet health reminder",
        [
          emailParagraph(
            `This is a friendly reminder that <strong>${escapeHtml(pet)}</strong>&rsquo;s health care is coming up.`
          ),
          emailDetailTable([
            { label: "Pet", value: pet },
            { label: "Care item", value: vaccine },
            { label: "Due date", value: due },
          ]),
        ].join(""),
        {
          preheader: `${pet}'s ${vaccine} is due on ${due}`,
          cta: { label: "View pet profile", href: dashboardUrl },
        }
      ),
    };
  },

  "auth.signup": (_channel, p) => {
    const url = str(p.confirmation_url);
    const text = `Welcome to Saudi Petsitters! Confirm your email: ${url}`;
    return {
      subject: "Confirm your email — Saudi Petsitters",
      text,
      html: brandedHtml(
        "Confirm your email",
        emailParagraph(
          "Welcome to Saudi Petsitters! Please confirm your email address to get started."
        ),
        {
          preheader: "Confirm your email to get started",
          cta: { label: "Confirm email", href: url },
          showLinkFallback: true,
        }
      ),
    };
  },

  "auth.recovery": (_channel, p) => {
    const url = str(p.recovery_url);
    const text = `Reset your Saudi Petsitters password: ${url}`;
    return {
      subject: "Reset your password",
      text,
      html: brandedHtml(
        "Reset your password",
        [
          emailParagraph("We received a request to reset your password."),
          emailParagraph(
            `<span style="font-size:13px;color:#7A7470;">If you didn&rsquo;t request this, you can safely ignore this email.</span>`
          ),
        ].join(""),
        {
          preheader: "Reset your Saudi Petsitters password",
          cta: { label: "Reset password", href: url },
          showLinkFallback: true,
        }
      ),
    };
  },

  "auth.magic_link": (_channel, p) => {
    const url = str(p.magic_link_url);
    const text = `Sign in to Saudi Petsitters: ${url}`;
    return {
      subject: "Your sign-in link",
      text,
      html: brandedHtml(
        "Sign in to Saudi Petsitters",
        emailParagraph("Use the button below to sign in to your account. This link expires shortly."),
        {
          preheader: "Your one-time sign-in link",
          cta: { label: "Sign in", href: url },
          showLinkFallback: true,
        }
      ),
    };
  },

  "auth.email_change": (_channel, p) => {
    const url = str(p.confirmation_url);
    const text = `Confirm your new email address: ${url}`;
    return {
      subject: "Confirm email change",
      text,
      html: brandedHtml(
        "Confirm email change",
        emailParagraph("Please confirm your new email address to complete the change."),
        {
          preheader: "Confirm your new email address",
          cta: { label: "Confirm new email", href: url },
          showLinkFallback: true,
        }
      ),
    };
  },

  "auth.phone_otp": () => ({
    text: "",
  }),

  generic: (channel, p) => {
    const text = str(p.text, "You have a new notification from Saudi Petsitters.");
    if (channel === "sms") return { text };
    return {
      subject: "Notification from Saudi Petsitters",
      text,
      html: brandedHtml("Notification", emailParagraph(escapeHtml(text))),
    };
  },
};
