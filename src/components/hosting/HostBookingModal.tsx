"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Star, MapPin } from "lucide-react";
import PaymentModal from "@/components/payment/PaymentModal";
import { createHostingBookingWithEscrow, captureBookingPayment } from "@/lib/monetisation/actions";
import { quoteToSummary } from "@/lib/monetisation/pricing";
import { useHostingBookingQuote } from "@/lib/monetisation/use-booking-quote";

const SERVICE_LABELS = {
  boarding: "Boarding (per night)",
  daycare: "Daycare (per day)",
  home_sitting: "Home Sitting (per visit)",
  dog_walking: "Dog Walking (per walk)",
};

const PET_TYPES = ["dog", "cat", "bird", "rabbit", "fish", "reptile", "other"];

export default function HostBookingModal({ host, open, onClose }) {
  const [selectedService, setSelectedService] = useState("");
  const [form, setForm] = useState({
    pet_name: "",
    pet_type: "",
    start_date: "",
    end_date: "",
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    city: "",
    special_instructions: "",
  });
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const { toast } = useToast();

  const { quote, loading: quoteLoading, error: quoteError } = useHostingBookingQuote({
    hostId: host?.id,
    serviceType: selectedService,
    startDate: form.start_date,
    endDate: form.end_date,
    enabled: open && !!host,
  });

  if (!host) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quote) {
      toast({ title: "Unable to quote", description: quoteError || "Please check your booking details.", variant: "destructive" });
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentConfirm = async (gateway) => {
    setLoading(true);
    const result = await createHostingBookingWithEscrow({
      hostId: host.id,
      serviceType: selectedService,
      startDate: form.start_date,
      endDate: form.end_date || null,
      petName: form.pet_name,
      petType: form.pet_type,
      ownerName: form.owner_name,
      ownerEmail: form.owner_email,
      ownerPhone: form.owner_phone || null,
      city: form.city || host.city || null,
      specialInstructions: form.special_instructions || null,
      paymentProvider: gateway,
      idempotencyKey: crypto.randomUUID(),
    });
    if (result.ok === false) {
      setLoading(false);
      toast({ title: "Booking failed", description: result.error, variant: "destructive" });
      throw new Error(result.error);
    }
    const id = String(result.data.booking.id);
    setBookingId(id);
    const capture = await captureBookingPayment({
      bookingId: id,
      providerPaymentId: `placeholder-${gateway}-${Date.now()}`,
      idempotencyKey: crypto.randomUUID(),
    });
    setLoading(false);
    if (capture.ok === false) {
      toast({ title: "Payment failed", description: capture.error, variant: "destructive" });
      throw new Error(capture.error);
    }
    toast({
      title: "Payment secured in escrow",
      description: "Your booking is confirmed. Funds are held until the service is completed.",
    });
  };

  const handleClose = () => {
    setShowPayment(false);
    setBookingId(null);
    setSelectedService("");
    setForm({
      pet_name: "",
      pet_type: "",
      start_date: "",
      end_date: "",
      owner_name: "",
      owner_email: "",
      owner_phone: "",
      city: "",
      special_instructions: "",
    });
    onClose();
  };

  const paymentSummary = quote
    ? quoteToSummary(quote, `Booking with ${host.full_name}`)
    : { title: `Booking with ${host.full_name}`, lines: [], total: "—" };

  return (
    <>
      <PaymentModal
        open={showPayment}
        onClose={handleClose}
        summary={paymentSummary}
        onConfirm={handlePaymentConfirm}
      />
      <Dialog open={open && !showPayment} onOpenChange={handleClose}>
        <DialogContent className="max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                {host.photo_url ? (
                  <img src={host.photo_url} alt={host.full_name} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-lg">
                    {host.full_name?.[0]}
                  </div>
                )}
                <div>
                  <DialogTitle className="font-heading text-xl">{host.full_name}</DialogTitle>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {host.city}
                    </span>
                    {host.rating && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-rating text-rating" />
                        {host.rating}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <Label className="mb-1.5 block">Service *</Label>
                <Select value={selectedService} onValueChange={setSelectedService} required>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {(host.services || []).map((s) => (
                      <SelectItem key={s} value={s}>
                        {SERVICE_LABELS[s] || s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {quoteLoading && selectedService && form.start_date && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Calculating price...
                </div>
              )}
              {quoteError && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-xl p-3">{quoteError}</div>
              )}
              {quote && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-1.5">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Host price ({quote.units} unit{quote.units !== 1 ? "s" : ""})</span>
                    <span>
                      {quote.currency} {quote.base_amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-primary font-medium">
                    <span>Platform fee ({quote.guest_service_fee_pct}%)</span>
                    <span>
                      {quote.currency} {quote.guest_fee_amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-border pt-1.5 flex justify-between text-sm font-bold">
                    <span>Total due now</span>
                    <span>
                      {quote.currency} {quote.total_amount.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    Funds are held in escrow until the service is completed.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">Pet Name *</Label>
                  <Input
                    required
                    value={form.pet_name}
                    onChange={(e) => setForm((f) => ({ ...f, pet_name: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block">Pet Type *</Label>
                  <Select value={form.pet_type} onValueChange={(v) => setForm((f) => ({ ...f, pet_type: v }))}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {PET_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="capitalize">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">Start Date *</Label>
                  <Input
                    required
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block">End Date</Label>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">Your Name *</Label>
                  <Input
                    required
                    value={form.owner_name}
                    onChange={(e) => setForm((f) => ({ ...f, owner_name: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block">Email *</Label>
                  <Input
                    required
                    type="email"
                    value={form.owner_email}
                    onChange={(e) => setForm((f) => ({ ...f, owner_email: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">Phone</Label>
                  <Input
                    value={form.owner_phone}
                    onChange={(e) => setForm((f) => ({ ...f, owner_phone: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block">City</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-1.5 block">Special Instructions</Label>
                <Textarea
                  value={form.special_instructions}
                  onChange={(e) => setForm((f) => ({ ...f, special_instructions: e.target.value }))}
                  placeholder="Dietary needs, medications, special care..."
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1 rounded-xl">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    quoteLoading ||
                    !quote ||
                    !selectedService ||
                    !form.pet_name ||
                    !form.owner_email ||
                    !form.start_date
                  }
                  className="flex-1 rounded-xl"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Book & Pay"}
                </Button>
              </div>
            </form>
          </>
        </DialogContent>
      </Dialog>
    </>
  );
}
