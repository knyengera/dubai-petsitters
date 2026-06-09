import { getAppBaseUrl } from "@/lib/notifications/config";
import type { NotificationChannel, RenderedNotification } from "@/lib/notifications/types";

function link(path: string): string {
  return `${getAppBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function str(value: unknown, fallback = ""): string {
  if (value == null) return fallback;
  return String(value);
}

function wrapHtml(title: string, body: string): string {
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <h1 style="font-size:20px;margin:0 0 16px;">${title}</h1>
      ${body}
      <p style="margin-top:24px;font-size:12px;color:#666;">Saudi Petsitters</p>
    </div>
  </body></html>`;
}

export function renderNotification(
  templateKey: string,
  channel: NotificationChannel,
  payload: Record<string, unknown>
): RenderedNotification {
  const renderer = TEMPLATES[templateKey] ?? TEMPLATES["generic"];
  return renderer(channel, payload);
}

type TemplateFn = (channel: NotificationChannel, payload: Record<string, unknown>) => RenderedNotification;

const TEMPLATES: Record<string, TemplateFn> = {
  "booking.request": (channel, p) => {
    const owner = str(p.owner_name, "A pet owner");
    const pet = str(p.pet_name, "a pet");
    const dates = [p.start_date, p.end_date].filter(Boolean).join(" – ");
    const text = `New booking request from ${owner} for ${pet}${dates ? ` (${dates})` : ""}. View: ${link("/host-calendar")}`;
    if (channel === "sms") return { text };
    return {
      subject: `New booking request for ${pet}`,
      text,
      html: wrapHtml(
        "New booking request",
        `<p><strong>${owner}</strong> requested hosting for <strong>${pet}</strong>${dates ? ` on ${dates}` : ""}.</p>
         <p><a href="${link("/host-calendar")}">View your calendar</a></p>`
      ),
    };
  },

  "booking.confirmed": (channel, p) => {
    const pet = str(p.pet_name, "your pet");
    const text = `Your booking for ${pet} is confirmed. Details: ${link("/my-appointments")}`;
    if (channel === "sms") return { text };
    return {
      subject: `Booking confirmed — ${pet}`,
      text,
      html: wrapHtml(
        "Booking confirmed",
        `<p>Your hosting booking for <strong>${pet}</strong> is confirmed.</p>
         <p><a href="${link("/my-appointments")}">View booking details</a></p>`
      ),
    };
  },

  "booking.confirmed.host": (channel, p) => {
    const pet = str(p.pet_name, "a pet");
    const owner = str(p.owner_name, "the owner");
    const text = `Booking confirmed: ${owner}'s ${pet}. ${link("/host-calendar")}`;
    if (channel === "sms") return { text };
    return {
      subject: `Booking confirmed — ${pet}`,
      text,
      html: wrapHtml(
        "Booking confirmed",
        `<p><strong>${owner}</strong>'s booking for <strong>${pet}</strong> is confirmed and paid.</p>
         <p><a href="${link("/host-calendar")}">View calendar</a></p>`
      ),
    };
  },

  "payment.confirmed": (channel, p) => {
    const amount = str(p.amount);
    const currency = str(p.currency, "SAR");
    const text = `Payment of ${amount} ${currency} received. Thank you!`;
    if (channel === "sms") return { text };
    return {
      subject: "Payment confirmed",
      text,
      html: wrapHtml(
        "Payment confirmed",
        `<p>We received your payment of <strong>${amount} ${currency}</strong>.</p>`
      ),
    };
  },

  "message.new": (channel, p) => {
    const sender = str(p.sender_name, "Someone");
    const preview = str(p.preview);
    const convId = str(p.conversation_id);
    const text = `New message from ${sender}: "${preview}". Reply: ${link(`/messages?id=${convId}`)}`;
    if (channel === "sms") return { text: `New message from ${sender}. ${link(`/messages?id=${convId}`)}` };
    return {
      subject: `New message from ${sender}`,
      text,
      html: wrapHtml(
        `Message from ${sender}`,
        `<p><strong>${sender}</strong> sent you a message:</p>
         <blockquote style="border-left:3px solid #ddd;padding-left:12px;color:#444;">${preview}</blockquote>
         <p><a href="${link(`/messages?id=${convId}`)}">Reply in app</a></p>`
      ),
    };
  },

  "appointment.request": (channel, p) => {
    const pet = str(p.pet_name, "your pet");
    const clinic = str(p.clinic_name, "the clinic");
    const text = `Appointment request submitted for ${pet} at ${clinic}. We'll notify you when it's reviewed.`;
    if (channel === "sms") return { text };
    return {
      subject: "Appointment request received",
      text,
      html: wrapHtml(
        "Appointment request received",
        `<p>Your appointment request for <strong>${pet}</strong> at <strong>${clinic}</strong> was submitted.</p>
         <p><a href="${link("/my-appointments")}">View appointments</a></p>`
      ),
    };
  },

  "appointment.status": (channel, p) => {
    const status = str(p.status);
    const pet = str(p.pet_name, "your pet");
    const text = `Appointment for ${pet} is now ${status}. ${link("/my-appointments")}`;
    if (channel === "sms") return { text };
    return {
      subject: `Appointment ${status}`,
      text,
      html: wrapHtml(
        `Appointment ${status}`,
        `<p>Your appointment for <strong>${pet}</strong> is now <strong>${status}</strong>.</p>
         <p><a href="${link("/my-appointments")}">View details</a></p>`
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
      html: wrapHtml(
        "New adoption request",
        `<p><strong>${applicant}</strong> applied to adopt <strong>${pet}</strong>.</p>`
      ),
    };
  },

  "payout.status": (channel, p) => {
    const status = str(p.status);
    const amount = str(p.net_amount);
    const currency = str(p.currency, "SAR");
    const text = `Payout ${status}: ${amount} ${currency}.`;
    if (channel === "sms") return { text };
    return {
      subject: `Payout ${status}`,
      text,
      html: wrapHtml(
        `Payout ${status}`,
        `<p>Your payout of <strong>${amount} ${currency}</strong> is <strong>${status}</strong>.</p>`
      ),
    };
  },

  "escrow.released": (channel, p) => {
    const amount = str(p.host_earnings);
    const currency = str(p.currency, "SAR");
    const pet = str(p.pet_name, "booking");
    const text = `Earnings of ${amount} ${currency} released for ${pet}.`;
    if (channel === "sms") return { text };
    return {
      subject: "Earnings released",
      text,
      html: wrapHtml(
        "Earnings released",
        `<p><strong>${amount} ${currency}</strong> from the <strong>${pet}</strong> booking has been released to your balance.</p>`
      ),
    };
  },

  "reminder.pet_health": (channel, p) => {
    const pet = str(p.pet_name, "your pet");
    const vaccine = str(p.vaccine_name, "vaccination");
    const due = str(p.due_date);
    const text = `Reminder: ${pet}'s ${vaccine} is due on ${due}.`;
    if (channel === "sms") return { text };
    return {
      subject: `${pet} health reminder`,
      text,
      html: wrapHtml(
        "Pet health reminder",
        `<p><strong>${pet}</strong>'s <strong>${vaccine}</strong> is due on <strong>${due}</strong>.</p>
         <p><a href="${link("/dashboard")}">View pet profile</a></p>`
      ),
    };
  },

  // Auth templates (used by hooks, not outbox)
  "auth.signup": (_channel, p) => {
    const url = str(p.confirmation_url);
    const text = `Welcome to Saudi Petsitters! Confirm your email: ${url}`;
    return {
      subject: "Confirm your email — Saudi Petsitters",
      text,
      html: wrapHtml(
        "Confirm your email",
        `<p>Welcome! Please confirm your email address to get started.</p>
         <p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;border-radius:8px;">Confirm email</a></p>
         <p style="font-size:12px;color:#666;">Or copy this link: ${url}</p>`
      ),
    };
  },

  "auth.recovery": (_channel, p) => {
    const url = str(p.recovery_url);
    const text = `Reset your Saudi Petsitters password: ${url}`;
    return {
      subject: "Reset your password",
      text,
      html: wrapHtml(
        "Reset your password",
        `<p>We received a request to reset your password.</p>
         <p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;border-radius:8px;">Reset password</a></p>
         <p style="font-size:12px;color:#666;">If you didn't request this, you can ignore this email.</p>`
      ),
    };
  },

  "auth.magic_link": (_channel, p) => {
    const url = str(p.magic_link_url);
    const text = `Sign in to Saudi Petsitters: ${url}`;
    return {
      subject: "Your sign-in link",
      text,
      html: wrapHtml(
        "Sign in",
        `<p><a href="${url}">Click here to sign in</a></p>`
      ),
    };
  },

  "auth.email_change": (_channel, p) => {
    const url = str(p.confirmation_url);
    const text = `Confirm your new email address: ${url}`;
    return {
      subject: "Confirm email change",
      text,
      html: wrapHtml(
        "Confirm email change",
        `<p><a href="${url}">Confirm your new email address</a></p>`
      ),
    };
  },

  "auth.phone_otp": () => ({
    text: "", // OTP body set dynamically in hook
  }),

  generic: (channel, p) => {
    const text = str(p.text, "You have a new notification from Saudi Petsitters.");
    if (channel === "sms") return { text };
    return {
      subject: "Notification from Saudi Petsitters",
      text,
      html: wrapHtml("Notification", `<p>${text}</p>`),
    };
  },
};
