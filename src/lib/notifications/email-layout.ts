import { getAppBaseUrl } from "@/lib/notifications/config";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_TEL } from "@/lib/seo/site";

/** Brand palette from globals.css (hex for email client compatibility). */
export const EMAIL_BRAND = {
  primary: "#2E1B5E",
  primaryDark: "#1A0F2E",
  primaryForeground: "#FFFFFF",
  accent: "#D9B04A",
  background: "#F7F5F3",
  card: "#FFFFFF",
  foreground: "#1A0F2E",
  mutedForeground: "#7A7470",
  border: "#E4DFDA",
  muted: "#EFEBE8",
  fontHeading: "Roboto, Arial, Helvetica, sans-serif",
  fontBody: "Poppins, Arial, Helvetica, sans-serif",
  appName: "Saudi Petsitters",
} as const;

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function logoUrl(): string {
  return `${getAppBaseUrl()}/logo.png`;
}

/** Outlook-safe CTA button (bulletproof pattern with VML fallback). */
export function emailButton(label: string, href: string): string {
  const safeLabel = escapeHtml(label);
  const safeHref = escapeHtml(href);
  const bg = EMAIL_BRAND.primary;

  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="left" style="margin:24px 0 8px 0;">
  <tr>
    <td align="center" style="border-radius:12px;background-color:${bg};">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
        href="${safeHref}" style="height:44px;v-text-anchor:middle;width:220px;" arcsize="18%" strokecolor="${bg}" fillcolor="${bg}">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${safeLabel}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="${safeHref}" target="_blank"
        style="display:inline-block;padding:12px 28px;font-family:${EMAIL_BRAND.fontBody};font-size:15px;font-weight:600;
        color:#ffffff;text-decoration:none;border-radius:12px;background-color:${bg};mso-padding-alt:0;">
        ${safeLabel}
      </a>
      <!--<![endif]-->
    </td>
  </tr>
</table>`;
}

export function emailParagraph(html: string): string {
  return `<p style="margin:0 0 16px 0;font-family:${EMAIL_BRAND.fontBody};font-size:15px;line-height:24px;color:${EMAIL_BRAND.foreground};">${html}</p>`;
}

export function emailHeading(text: string): string {
  return `<h1 style="margin:0 0 12px 0;font-family:${EMAIL_BRAND.fontHeading};font-size:22px;line-height:28px;font-weight:700;color:${EMAIL_BRAND.foreground};">${escapeHtml(text)}</h1>`;
}

export function emailQuote(text: string): string {
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 16px 0;">
  <tr>
    <td style="border-left:4px solid ${EMAIL_BRAND.accent};padding:12px 16px;background-color:${EMAIL_BRAND.muted};border-radius:0 8px 8px 0;">
      <p style="margin:0;font-family:${EMAIL_BRAND.fontBody};font-size:14px;line-height:22px;color:${EMAIL_BRAND.mutedForeground};font-style:italic;">${escapeHtml(text)}</p>
    </td>
  </tr>
</table>`;
}

export function emailDetailTable(
  rows: Array<{ label: string; value: string }>
): string {
  const items = rows
    .filter((r) => r.value)
    .map(
      (r) => `
    <tr>
      <td style="padding:8px 0;font-family:${EMAIL_BRAND.fontBody};font-size:13px;color:${EMAIL_BRAND.mutedForeground};width:120px;vertical-align:top;">${escapeHtml(r.label)}</td>
      <td style="padding:8px 0;font-family:${EMAIL_BRAND.fontBody};font-size:14px;color:${EMAIL_BRAND.foreground};font-weight:500;vertical-align:top;">${escapeHtml(r.value)}</td>
    </tr>`
    )
    .join("");

  if (!items) return "";

  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 16px 0;background-color:${EMAIL_BRAND.muted};border-radius:12px;border:1px solid ${EMAIL_BRAND.border};">
  <tr>
    <td style="padding:16px 20px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${items}</table>
    </td>
  </tr>
</table>`;
}

export function emailLinkFallback(href: string): string {
  return emailParagraph(
    `<span style="font-size:13px;color:${EMAIL_BRAND.mutedForeground};">Or copy this link:<br/>
    <a href="${escapeHtml(href)}" style="color:${EMAIL_BRAND.primary};word-break:break-all;">${escapeHtml(href)}</a></span>`
  );
}

export interface BrandedEmailOptions {
  title: string;
  preheader?: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
  showLinkFallback?: boolean;
}

/**
 * Outlook-compatible branded HTML email shell (table layout, inline CSS, VML buttons).
 */
export function buildBrandedEmail(options: BrandedEmailOptions): string {
  const { title, preheader, bodyHtml, cta, showLinkFallback } = options;
  const b = EMAIL_BRAND;
  const year = new Date().getFullYear();
  const ctaHtml = cta
    ? emailButton(cta.label, cta.href) +
      (showLinkFallback ? emailLinkFallback(cta.href) : "")
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${b.background};">
  ${preheader ? `<div style="display:none;font-size:1px;color:${b.background};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${b.background};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" class="email-container" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;">
          <!-- Header -->
          <tr>
            <td align="center" style="background-color:${b.primary};border-radius:16px 16px 0 0;padding:28px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <img src="${logoUrl()}" width="140" height="auto" alt="${escapeHtml(b.appName)}" style="display:block;max-width:140px;height:auto;" />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:12px;">
                    <p style="margin:0;font-family:${b.fontHeading};font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:${b.accent};font-weight:600;">Pet care across Saudi Arabia</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:${b.card};padding:32px;border-left:1px solid ${b.border};border-right:1px solid ${b.border};">
              ${emailHeading(title)}
              ${bodyHtml}
              ${ctaHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:${b.muted};border:1px solid ${b.border};border-top:0;border-radius:0 0 16px 16px;padding:24px 32px;">
              <p style="margin:0 0 8px 0;font-family:${b.fontBody};font-size:13px;line-height:20px;color:${b.mutedForeground};">
                &copy; ${year} ${escapeHtml(b.appName)}. All rights reserved.
              </p>
              <p style="margin:0 0 8px 0;font-family:${b.fontBody};font-size:12px;line-height:18px;color:${b.mutedForeground};">
                <a href="tel:${escapeHtml(CONTACT_PHONE_TEL)}" style="color:${b.primary};text-decoration:underline;">${escapeHtml(CONTACT_PHONE)}</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:${escapeHtml(CONTACT_EMAIL)}" style="color:${b.primary};text-decoration:underline;">${escapeHtml(CONTACT_EMAIL)}</a>
              </p>
              <p style="margin:0;font-family:${b.fontBody};font-size:12px;line-height:18px;color:${b.mutedForeground};">
                <a href="${getAppBaseUrl()}" style="color:${b.primary};text-decoration:underline;">Visit our website</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
