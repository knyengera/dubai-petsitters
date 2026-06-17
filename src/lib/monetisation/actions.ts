"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, getSessionUser } from "@/lib/admin/auth";
import { getHostPayoutSettings } from "@/lib/hosting/payout-settings";
import { isSupportedPaymentProvider, DEFAULT_CURRENCY } from "@/lib/monetisation/constants";
import { parseBookingQuote } from "@/lib/monetisation/pricing";
import { createGatewayRefund, getPaymentMethodInfo } from "@/lib/payments/refund";
import { parsePaymentRecord } from "@/lib/payments/refund-reconcile";
import type {
  BookingQuote,
  CreateBookingInput,
  HostBalance,
  HostBookingCalendar,
  HostPayoutRequest,
  MonetisationActionResult,
  PaymentProviderSettings,
  PlatformFeeSettings,
} from "@/lib/monetisation/types";

function toError(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

type RpcResult = { data: unknown; error: { message: string } | null };

async function callRpc(
  supabase: Awaited<ReturnType<typeof createClient>>,
  fn: string,
  args: Record<string, unknown>
): Promise<RpcResult> {
  const client = supabase as unknown as {
    rpc(name: string, params?: Record<string, unknown>): Promise<RpcResult>;
  };
  return client.rpc(fn, args);
}

function parseRow<T>(value: unknown): T {
  return value as T;
}

function parseHostBookingCalendar(value: unknown): HostBookingCalendar | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  return {
    host_available: row.host_available !== false,
    blocked_dates: Array.isArray(row.blocked_dates)
      ? row.blocked_dates.map((d) => String(d).replace(/^"|"$/g, ""))
      : [],
    booked_dates: Array.isArray(row.booked_dates)
      ? row.booked_dates.map((d) => String(d).replace(/^"|"$/g, ""))
      : [],
    custom_prices: Array.isArray(row.custom_prices)
      ? row.custom_prices.map((item) => {
          const entry = item as Record<string, unknown>;
          return {
            date: String(entry.date ?? "").replace(/^"|"$/g, ""),
            price: Number(entry.price ?? 0),
          };
        })
      : [],
  };
}

export async function getHostBookingCalendar(input: {
  hostId: string;
  from?: string;
  to?: string;
}): Promise<MonetisationActionResult<HostBookingCalendar>> {
  try {
    const supabase = await createClient();
    const { data, error } = await callRpc(supabase, "get_host_booking_calendar", {
      p_host_id: input.hostId,
      p_from: input.from || null,
      p_to: input.to || null,
    });
    if (error) return { ok: false, error: error.message };
    const calendar = parseHostBookingCalendar(data);
    if (!calendar) return { ok: false, error: "Invalid calendar response" };
    return { ok: true, data: calendar };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function getBookingQuote(input: {
  hostId: string;
  serviceType: string;
  startDate: string;
  endDate?: string | null;
  currency?: string;
}): Promise<MonetisationActionResult<BookingQuote>> {
  try {
    const supabase = await createClient();
    const { data, error } = await callRpc(supabase, "monetisation_quote_booking", {
      p_host_id: input.hostId,
      p_service_type: input.serviceType,
      p_start_date: input.startDate,
      p_end_date: input.endDate || null,
      p_currency: input.currency || DEFAULT_CURRENCY,
    });
    if (error) return { ok: false, error: error.message };
    const quote = parseBookingQuote(data);
    if (!quote) return { ok: false, error: "Invalid quote response" };
    return { ok: true, data: quote };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function createHostingBookingWithEscrow(
  input: CreateBookingInput
): Promise<
  MonetisationActionResult<{
    booking: Record<string, unknown>;
    payment: Record<string, unknown>;
    escrow: Record<string, unknown>;
    quote: BookingQuote;
  }>
> {
  try {
    const user = await getSessionUser();
    if (!user?.email) return { ok: false, error: "Authentication required" };

    if (!isSupportedPaymentProvider(input.paymentProvider)) {
      return { ok: false, error: "Unsupported payment provider" };
    }

    const supabase = await createClient();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) return { ok: false, error: profileError.message };

    const profileRow = profile as { full_name: string | null; phone: string | null } | null;
    const ownerName = profileRow?.full_name?.trim();
    if (!ownerName) {
      return { ok: false, error: "Complete your profile before booking." };
    }

    const ownerEmail = user.email;
    const ownerPhone = profileRow?.phone?.trim() || null;

    const { data: host, error: hostError } = await supabase
      .from("pet_hosts")
      .select("accepted_pet_types")
      .eq("id", input.hostId)
      .maybeSingle();

    if (hostError) return { ok: false, error: hostError.message };
    if (!host) return { ok: false, error: "Host not found" };

    const hostRow = host as { accepted_pet_types: string[] | null };
    const acceptedTypes = hostRow.accepted_pet_types ?? [];
    const petType = input.petType.toLowerCase().trim();
    if (acceptedTypes.length > 0 && !acceptedTypes.map((t) => t.toLowerCase()).includes(petType)) {
      return { ok: false, error: "This host does not accept that pet type." };
    }

    const { data, error } = await callRpc(supabase, "monetisation_create_hosting_booking", {
      p_host_id: input.hostId,
      p_service_type: input.serviceType,
      p_start_date: input.startDate,
      p_end_date: input.endDate || null,
      p_pet_name: input.petName,
      p_pet_type: input.petType,
      p_owner_name: ownerName,
      p_owner_email: ownerEmail,
      p_owner_phone: ownerPhone,
      p_city: input.city || null,
      p_special_instructions: null,
      p_payment_provider: input.paymentProvider,
      p_idempotency_key: input.idempotencyKey || null,
    });

    if (error) return { ok: false, error: error.message };

    const payload = data as Record<string, unknown>;
    const quote = parseBookingQuote(payload.quote);
    if (!quote) return { ok: false, error: "Invalid booking response" };

    revalidatePath("/admin/bookings");
    revalidatePath("/host-calendar");
    revalidatePath("/host-earnings");
    revalidatePath("/dashboard");

    return {
      ok: true,
      data: {
        booking: parseRow(payload.booking),
        payment: parseRow(payload.payment),
        escrow: parseRow(payload.escrow),
        quote,
      },
    };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function captureBookingPayment(input: {
  bookingId: string;
  providerPaymentId?: string;
  idempotencyKey?: string;
}): Promise<MonetisationActionResult<Record<string, unknown>>> {
  try {
    const supabase = await createClient();
    const { data, error } = await callRpc(supabase, "monetisation_capture_booking_payment", {
      p_booking_id: input.bookingId,
      p_provider_payment_id: input.providerPaymentId || null,
      p_idempotency_key: input.idempotencyKey || null,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/bookings");
    revalidatePath("/host-calendar");
    revalidatePath("/host-earnings");
    revalidatePath("/dashboard");
    return { ok: true, data: parseRow(data) };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function markBookingCompleted(
  bookingId: string
): Promise<MonetisationActionResult<Record<string, unknown>>> {
  try {
    const supabase = await createClient();
    const { data, error } = await callRpc(supabase, "monetisation_mark_booking_completed", {
      p_booking_id: bookingId,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/bookings");
    revalidatePath("/host-calendar");
    revalidatePath("/host-earnings");
    revalidatePath("/dashboard");
    return { ok: true, data: parseRow(data) };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

const REFUNDABLE_ESCROW_STATUSES = new Set(["held", "release_pending", "released"]);

export async function refundEscrowPayment(input: {
  bookingId: string;
  amount?: number;
  reason?: string;
}): Promise<MonetisationActionResult<Record<string, unknown>>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data: escrowRow, error: escrowError } = await supabase
      .from("escrow_accounts")
      .select("*")
      .eq("booking_id", input.bookingId)
      .maybeSingle();

    if (escrowError || !escrowRow) {
      return { ok: false, error: escrowError?.message ?? "Escrow account not found" };
    }

    const escrow = escrowRow as Record<string, unknown>;
    const escrowStatus = String(escrow.status);
    if (!REFUNDABLE_ESCROW_STATUSES.has(escrowStatus)) {
      return { ok: false, error: "Escrow is not refundable in its current state" };
    }

    const grossAmount = Number(escrow.gross_amount ?? 0);
    const refundedAmount = Number(escrow.refunded_amount ?? 0);
    const refundableAmount = Math.max(0, grossAmount - refundedAmount);
    if (refundableAmount <= 0) {
      return { ok: false, error: "No refundable balance remaining" };
    }

    const refundAmount = input.amount ?? refundableAmount;
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      return { ok: false, error: "Invalid refund amount" };
    }
    if (refundAmount > refundableAmount + 0.001) {
      return { ok: false, error: `Refund amount cannot exceed ${refundableAmount.toFixed(2)}` };
    }

    const paymentId = escrow.payment_id ? String(escrow.payment_id) : null;
    if (!paymentId) {
      return { ok: false, error: "No payment linked to escrow" };
    }

    const { data: paymentRow, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .maybeSingle();

    if (paymentError || !paymentRow) {
      return { ok: false, error: paymentError?.message ?? "Payment not found" };
    }

    const payment = parsePaymentRecord(paymentRow as Record<string, unknown>);
    const idempotencyKey = `refund:${input.bookingId}:${refundAmount.toFixed(2)}:${Date.now()}`;

    let gatewayResult;
    try {
      gatewayResult = await createGatewayRefund(payment, refundAmount, idempotencyKey);
    } catch (e) {
      return { ok: false, error: toError(e) };
    }

    const { data, error } = await callRpc(supabase, "monetisation_record_escrow_refund", {
      p_booking_id: input.bookingId,
      p_amount: refundAmount,
      p_provider_refund_id: gatewayResult.providerRefundId,
      p_reason: input.reason ?? null,
      p_metadata: { provider: gatewayResult.provider, source: "admin" },
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/escrow");
    revalidatePath("/admin/ledger");
    revalidatePath("/host-calendar");
    revalidatePath("/host-earnings");
    revalidatePath("/dashboard");
    return { ok: true, data: parseRow(data) };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function releaseEscrow(
  bookingId: string
): Promise<MonetisationActionResult<Record<string, unknown>>> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await callRpc(supabase, "monetisation_release_escrow", {
      p_booking_id: bookingId,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/escrow");
    revalidatePath("/host-calendar");
    revalidatePath("/host-earnings");
    revalidatePath("/dashboard");
    return { ok: true, data: parseRow(data) };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function getHostBalance(hostId: string): Promise<MonetisationActionResult<HostBalance | null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("host_balances")
      .select("*")
      .eq("host_id", hostId)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: true, data: null };
    const row = data as Record<string, unknown>;
    return {
      ok: true,
      data: {
        host_id: String(row.host_id),
        currency: String(row.currency ?? DEFAULT_CURRENCY),
        available_balance: Number(row.available_balance ?? 0),
        pending_balance: Number(row.pending_balance ?? 0),
        lifetime_earned: Number(row.lifetime_earned ?? 0),
        lifetime_paid_out: Number(row.lifetime_paid_out ?? 0),
        updated_at: String(row.updated_at ?? ""),
      },
    };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function requestHostPayout(input: {
  hostId: string;
  grossAmount: number;
  paymentProvider?: string;
  notes?: string;
  idempotencyKey?: string;
}): Promise<MonetisationActionResult<{ payout: HostPayoutRequest; balance: HostBalance }>> {
  try {
    const settingsResult = await getHostPayoutSettings(input.hostId);
    if (settingsResult.ok === false) {
      return { ok: false, error: settingsResult.error };
    }
    if (!settingsResult.data) {
      return {
        ok: false,
        error: "Add a payout method before requesting a withdrawal",
      };
    }

    const provider = input.paymentProvider || settingsResult.data.payout_method;
    if (!isSupportedPaymentProvider(provider)) {
      return { ok: false, error: "Unsupported payout provider" };
    }
    if (provider !== settingsResult.data.payout_method) {
      return { ok: false, error: "Payout method does not match saved settings" };
    }
    if (!Number.isFinite(input.grossAmount) || input.grossAmount <= 0) {
      return { ok: false, error: "Invalid payout amount" };
    }

    const supabase = await createClient();
    const { data, error } = await callRpc(supabase, "monetisation_request_host_payout", {
      p_host_id: input.hostId,
      p_gross_amount: input.grossAmount,
      p_payment_provider: provider,
      p_notes: input.notes || null,
      p_idempotency_key: input.idempotencyKey || null,
    });
    if (error) return { ok: false, error: error.message };

    const payload = data as Record<string, unknown>;
    const payout = payload.payout as Record<string, unknown>;
    const balance = payload.balance as Record<string, unknown>;

    revalidatePath("/host-calendar");
    revalidatePath("/host-earnings");
    revalidatePath("/dashboard");
    revalidatePath("/admin/payouts");

    return {
      ok: true,
      data: {
        payout: {
          id: String(payout.id),
          host_id: String(payout.host_id),
          currency: String(payout.currency ?? DEFAULT_CURRENCY),
          gross_amount: Number(payout.gross_amount),
          payout_fee_pct: Number(payout.payout_fee_pct),
          payout_fee_amount: Number(payout.payout_fee_amount),
          net_amount: Number(payout.net_amount),
          status: payout.status as HostPayoutRequest["status"],
          payment_provider: payout.payment_provider ? String(payout.payment_provider) : null,
          provider_payout_id: payout.provider_payout_id ? String(payout.provider_payout_id) : null,
          notes: payout.notes ? String(payout.notes) : null,
          admin_notes: payout.admin_notes ? String(payout.admin_notes) : null,
          requested_by_email: String(payout.requested_by_email),
          approved_at: payout.approved_at ? String(payout.approved_at) : null,
          paid_at: payout.paid_at ? String(payout.paid_at) : null,
          created_at: String(payout.created_at),
          updated_at: String(payout.updated_at),
        },
        balance: {
          host_id: String(balance.host_id),
          currency: String(balance.currency ?? DEFAULT_CURRENCY),
          available_balance: Number(balance.available_balance ?? 0),
          pending_balance: Number(balance.pending_balance ?? 0),
          lifetime_earned: Number(balance.lifetime_earned ?? 0),
          lifetime_paid_out: Number(balance.lifetime_paid_out ?? 0),
          updated_at: String(balance.updated_at ?? ""),
        },
      },
    };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminUpdatePayoutStatus(input: {
  payoutId: string;
  status: HostPayoutRequest["status"];
  adminNotes?: string;
  providerPayoutId?: string;
}): Promise<MonetisationActionResult<Record<string, unknown>>> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await callRpc(supabase, "monetisation_admin_update_payout_status", {
      p_payout_id: input.payoutId,
      p_status: input.status,
      p_admin_notes: input.adminNotes || null,
      p_provider_payout_id: input.providerPayoutId || null,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/payouts");
    return { ok: true, data: parseRow(data) };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminListFeeSettings(): Promise<MonetisationActionResult<PlatformFeeSettings[]>> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("platform_fee_settings")
      .select("*")
      .order("effective_from", { ascending: false });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []) as PlatformFeeSettings[] };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminUpsertFeeSettings(
  payload: Partial<PlatformFeeSettings> & { name: string }
): Promise<MonetisationActionResult<PlatformFeeSettings>> {
  try {
    await requireAdmin();
    const supabase = await createClient();

    if (payload.is_active) {
      await supabase
        .from("platform_fee_settings")
        .update({ is_active: false, updated_at: new Date().toISOString() } as never)
        .eq("currency", payload.currency || DEFAULT_CURRENCY)
        .eq("is_active", true);
    }

    const row = {
      name: payload.name,
      guest_service_fee_pct: payload.guest_service_fee_pct ?? 10,
      host_payout_fee_pct: payload.host_payout_fee_pct ?? 2,
      guest_fee_min: payload.guest_fee_min ?? 0,
      guest_fee_max: payload.guest_fee_max ?? null,
      host_payout_fee_min: payload.host_payout_fee_min ?? 0,
      host_payout_fee_max: payload.host_payout_fee_max ?? null,
      currency: payload.currency || DEFAULT_CURRENCY,
      is_active: payload.is_active ?? true,
      effective_from: payload.effective_from || new Date().toISOString(),
      effective_until: payload.effective_until ?? null,
      updated_at: new Date().toISOString(),
    };

    const query = payload.id
      ? supabase.from("platform_fee_settings").update(row as never).eq("id", payload.id).select().single()
      : supabase.from("platform_fee_settings").insert(row as never).select().single();

    const { data, error } = await query;
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/fees");
    return { ok: true, data: data as PlatformFeeSettings };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminListEscrowAccounts(): Promise<MonetisationActionResult<Record<string, unknown>[]>> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("escrow_accounts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return { ok: false, error: error.message };

    const accounts = (data ?? []) as Record<string, unknown>[];
    const hostIds = [...new Set(accounts.map((row) => String(row.host_id)).filter(Boolean))];
    const paymentIds = [...new Set(accounts.map((row) => String(row.payment_id)).filter(Boolean))];

    const hostNameById = new Map<string, string>();
    if (hostIds.length > 0) {
      const { data: hostRows, error: hostError } = await supabase
        .from("pet_hosts")
        .select("id, full_name")
        .in("id", hostIds);
      if (hostError) return { ok: false, error: hostError.message };
      for (const row of hostRows ?? []) {
        const host = row as Record<string, unknown>;
        hostNameById.set(String(host.id), String(host.full_name ?? ""));
      }
    }

    const paymentById = new Map<string, Record<string, unknown>>();
    if (paymentIds.length > 0) {
      const { data: paymentRows, error: paymentError } = await supabase
        .from("payments")
        .select("id, payment_provider, gateway, provider_payment_id, refunded_amount, payer_email, provider_payload")
        .in("id", paymentIds);
      if (paymentError) return { ok: false, error: paymentError.message };
      for (const row of paymentRows ?? []) {
        const payment = row as Record<string, unknown>;
        paymentById.set(String(payment.id), payment);
      }
    }

    const enriched = accounts.map((row) => {
      const grossAmount = Number(row.gross_amount ?? 0);
      const escrowRefunded = Number(row.refunded_amount ?? 0);
      const payment = row.payment_id ? paymentById.get(String(row.payment_id)) : undefined;
      const paymentRefunded = payment ? Number(payment.refunded_amount ?? 0) : escrowRefunded;
      const refundedAmount = Math.max(escrowRefunded, paymentRefunded);
      const refundableAmount = Math.max(0, grossAmount - refundedAmount);
      const status = String(row.status);
      const paymentRecord = payment ? parsePaymentRecord({ ...payment, amount: grossAmount, currency: row.currency, payment_type: "booking_escrow", status: "captured", payer_email: payment.payer_email ?? "" }) : null;
      const methodInfo = paymentRecord ? getPaymentMethodInfo(paymentRecord) : null;

      return {
        ...row,
        host_name: hostNameById.get(String(row.host_id)) || "Unknown host",
        refunded_amount: refundedAmount,
        refundable_amount: refundableAmount,
        payment_provider: payment ? String(payment.payment_provider ?? payment.gateway ?? "") : null,
        provider_payment_id: payment?.provider_payment_id ? String(payment.provider_payment_id) : null,
        payer_email: payment?.payer_email ? String(payment.payer_email) : null,
        payment_method_label: methodInfo?.label ?? null,
        can_refund: REFUNDABLE_ESCROW_STATUSES.has(status) && refundableAmount > 0,
      };
    });

    return { ok: true, data: enriched };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminListLedgerEntries(): Promise<MonetisationActionResult<Record<string, unknown>[]>> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ledger_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []) as Record<string, unknown>[] };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminListPayoutRequests(): Promise<MonetisationActionResult<Record<string, unknown>[]>> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("host_payout_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return { ok: false, error: error.message };

    const payouts = (data ?? []) as Record<string, unknown>[];
    const hostIds = [...new Set(payouts.map((p) => String(p.host_id)).filter(Boolean))];
    if (hostIds.length === 0) {
      return { ok: true, data: payouts };
    }

    const { data: settingsRows, error: settingsError } = await supabase
      .from("host_payout_settings")
      .select("*")
      .in("host_id", hostIds);
    if (settingsError) return { ok: false, error: settingsError.message };

    const settingsByHost = new Map(
      (settingsRows ?? []).map((row) => [String((row as Record<string, unknown>).host_id), row])
    );

    const enriched = payouts.map((payout) => {
      const settings = settingsByHost.get(String(payout.host_id));
      if (!settings) {
        return { ...payout, payout_destination: "Not configured" };
      }
      const s = settings as Record<string, unknown>;
      if (s.payout_method === "paypal") {
        return {
          ...payout,
          payout_destination: String(s.paypal_email ?? "PayPal"),
        };
      }
      const acct = String(s.bank_account_number ?? "");
      const masked = acct.length > 4 ? `****${acct.slice(-4)}` : "****";
      return {
        ...payout,
        payout_destination: `${s.bank_name ?? "Bank"} · ${masked}`,
      };
    });

    return { ok: true, data: enriched };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminUpdateHostTrust(input: {
  hostId: string;
  trustLevel?: string;
  trustedReleaseEnabled?: boolean;
  autoReleaseAfterHours?: number;
}): Promise<MonetisationActionResult<Record<string, unknown>>> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pet_hosts")
      .update({
        trust_level: input.trustLevel,
        trusted_release_enabled: input.trustedReleaseEnabled,
        auto_release_after_hours: input.autoReleaseAfterHours,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", input.hostId)
      .select()
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/hosts");
    return { ok: true, data: data as Record<string, unknown> };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminListPaymentProviders(): Promise<
  MonetisationActionResult<PaymentProviderSettings[]>
> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payment_provider_settings")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []) as PaymentProviderSettings[] };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminUpdatePaymentProvider(input: {
  providerId: string;
  isEnabled: boolean;
  sortOrder?: number;
}): Promise<MonetisationActionResult<PaymentProviderSettings>> {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payment_provider_settings")
      .update({
        is_enabled: input.isEnabled,
        sort_order: input.sortOrder,
        updated_at: new Date().toISOString(),
        updated_by: admin.email,
      } as never)
      .eq("provider_id", input.providerId)
      .select()
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/payment-settings");
    return { ok: true, data: data as PaymentProviderSettings };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function createVetSubscriptionPayment(input: {
  subscriptionId: string;
  gateway: string;
  amount: number;
  payerName: string;
  payerEmail: string;
  currency?: string;
}): Promise<MonetisationActionResult<Record<string, unknown>>> {
  try {
    if (!isSupportedPaymentProvider(input.gateway)) {
      return { ok: false, error: "Unsupported payment provider" };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payments")
      .insert({
        payment_type: "vet_subscription",
        gateway: input.gateway,
        payment_provider: input.gateway,
        amount: input.amount,
        currency: input.currency || DEFAULT_CURRENCY,
        status: "pending",
        reference_id: input.subscriptionId,
        payer_name: input.payerName,
        payer_email: input.payerEmail,
      } as never)
      .select()
      .single();

    if (error) return { ok: false, error: error.message };

    await supabase
      .from("vet_subscriptions")
      .update({
        gateway: input.gateway,
        payment_id: (data as Record<string, unknown>).id,
        status: "pending_payment",
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", input.subscriptionId);

    return { ok: true, data: data as Record<string, unknown> };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function createPartnerAdvertisingPayment(input: {
  inquiryId: string;
  gateway: string;
  amount: number;
  payerName: string;
  payerEmail: string;
  notes?: string;
  currency?: string;
}): Promise<MonetisationActionResult<Record<string, unknown>>> {
  try {
    if (!isSupportedPaymentProvider(input.gateway)) {
      return { ok: false, error: "Unsupported payment provider" };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("payments")
      .insert({
        payment_type: "partner_advertising",
        gateway: input.gateway,
        payment_provider: input.gateway,
        amount: input.amount,
        currency: input.currency || DEFAULT_CURRENCY,
        status: "pending",
        reference_id: input.inquiryId,
        payer_name: input.payerName,
        payer_email: input.payerEmail,
        notes: input.notes || null,
      } as never)
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as Record<string, unknown> };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminCaptureManualPayment(
  paymentId: string
): Promise<MonetisationActionResult<Record<string, unknown>>> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await callRpc(supabase, "monetisation_capture_payment", {
      p_payment_id: paymentId,
      p_provider_payment_id: `manual-${Date.now()}`,
      p_provider_payload: { source: "admin_manual" },
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/payments");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/escrow");
    return { ok: true, data: parseRow(data) };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}
