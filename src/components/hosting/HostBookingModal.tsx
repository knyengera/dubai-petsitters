"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { entities } from '@/lib/data/entities';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, Star, MapPin } from 'lucide-react';
import PaymentModal from '@/components/payment/PaymentModal';

const SERVICE_LABELS = {
  boarding: 'Boarding (per night)',
  daycare: 'Daycare (per day)',
  home_sitting: 'Home Sitting (per visit)',
  dog_walking: 'Dog Walking (per walk)',
};

const PET_TYPES = ['dog', 'cat', 'bird', 'rabbit', 'fish', 'reptile', 'other'];
const PLATFORM_FEE_PCT = 0.10;

export default function HostBookingModal({ host, open, onClose }) {
  const [selectedService, setSelectedService] = useState('');
  const [form, setForm] = useState({
    pet_name: '', pet_type: '', start_date: '', end_date: '',
    owner_name: '', owner_email: '', owner_phone: '', city: '', special_instructions: '',
  });
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const { toast } = useToast();

  if (!host) return null;

  // Determine price from host based on service
  const getServicePrice = (service) => {
    if (service === 'boarding') return host.price_per_night || 0;
    if (service === 'daycare') return host.price_per_day || 0;
    if (service === 'home_sitting') return host.price_per_night || host.price_per_day || 0;
    if (service === 'dog_walking') return host.price_per_day || 0;
    return 0;
  };

  const quotedPrice = getServicePrice(selectedService);
  const platformFee = Math.round(quotedPrice * PLATFORM_FEE_PCT * 100) / 100;
  const totalPrice = Math.round((quotedPrice + platformFee) * 100) / 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const booking = await entities.HostingBooking.create({
      ...form,
      service_type: selectedService,
      quoted_price: quotedPrice,
      platform_fee: platformFee,
      total_price: totalPrice,
    });
    setBookingId(booking.id);
    setLoading(false);
    setShowPayment(true);
  };

  const handlePaymentConfirm = async (gateway) => {
    await entities.Payment.create({
      payment_type: 'booking_fee',
      gateway,
      amount: platformFee,
      currency: 'SAR',
      reference_id: bookingId,
      payer_name: form.owner_name,
      payer_email: form.owner_email,
      status: 'pending',
    });
  };

  const handleClose = () => {
    setShowPayment(false);
    setBookingId(null);
    setSelectedService('');
    setForm({ pet_name: '', pet_type: '', start_date: '', end_date: '', owner_name: '', owner_email: '', owner_phone: '', city: '', special_instructions: '' });
    onClose();
  };

  const paymentSummary = {
    title: `Booking with ${host.full_name}`,
    lines: [
      { label: 'Service', value: SERVICE_LABELS[selectedService] || selectedService },
      { label: 'Host Price', value: `SAR ${quotedPrice.toFixed(2)}` },
      { label: 'Platform Fee (10%)', value: `SAR ${platformFee.toFixed(2)}` },
    ],
    total: `SAR ${totalPrice.toFixed(2)}`,
  };

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
        {false ? (
          <div className="text-center py-10">
            <CheckCircle className="w-14 h-14 text-primary mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-bold mb-2">Booking Submitted!</h2>
            <p className="text-muted-foreground mb-4">We will confirm your booking with {host.full_name} shortly.</p>
            <div className="inline-block bg-primary/5 border border-primary/20 rounded-xl px-6 py-4 mb-6 text-left">
              <p className="text-sm font-semibold mb-1">Payment Due on Confirmation</p>
              <p className="text-sm text-muted-foreground">
                10% platform fee: <strong>SAR {platformFee.toFixed(2)}</strong> · Total: <strong>SAR {totalPrice.toFixed(2)}</strong>
              </p>
            </div>
            <Button onClick={handleClose} className="rounded-xl">Close</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                {host.photo_url ? (
                  <img src={host.photo_url} alt={host.full_name} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-lg">{host.full_name?.[0]}</div>
                )}
                <div>
                  <DialogTitle className="font-heading text-xl">{host.full_name}</DialogTitle>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{host.city}</span>
                    {host.rating && <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{host.rating}</span>}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              {/* Service selector */}
              <div>
                <Label className="mb-1.5 block">Service *</Label>
                <Select value={selectedService} onValueChange={setSelectedService} required>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a service" /></SelectTrigger>
                  <SelectContent>
                    {(host.services || []).map(s => (
                      <SelectItem key={s} value={s}>
                        {SERVICE_LABELS[s] || s}
                        {getServicePrice(s) > 0 && ` — SAR ${getServicePrice(s)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price breakdown */}
              {selectedService && quotedPrice > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-1.5">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Host Price</span><span>SAR {quotedPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-primary font-medium">
                    <span>Platform Fee (10%)</span><span>SAR {platformFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-1.5 flex justify-between text-sm font-bold">
                    <span>Total</span><span>SAR {totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">Pet Name *</Label>
                  <Input required value={form.pet_name} onChange={e => setForm(f => ({ ...f, pet_name: e.target.value }))} className="rounded-xl" />
                </div>
                <div>
                  <Label className="mb-1.5 block">Pet Type *</Label>
                  <Select value={form.pet_type} onValueChange={v => setForm(f => ({ ...f, pet_type: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{PET_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">Start Date *</Label>
                  <Input required type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="rounded-xl" />
                </div>
                <div>
                  <Label className="mb-1.5 block">End Date</Label>
                  <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">Your Name *</Label>
                  <Input required value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} className="rounded-xl" />
                </div>
                <div>
                  <Label className="mb-1.5 block">Email *</Label>
                  <Input required type="email" value={form.owner_email} onChange={e => setForm(f => ({ ...f, owner_email: e.target.value }))} className="rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">Phone</Label>
                  <Input value={form.owner_phone} onChange={e => setForm(f => ({ ...f, owner_phone: e.target.value }))} className="rounded-xl" />
                </div>
                <div>
                  <Label className="mb-1.5 block">City</Label>
                  <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="rounded-xl" />
                </div>
              </div>

              <div>
                <Label className="mb-1.5 block">Special Instructions</Label>
                <Textarea value={form.special_instructions} onChange={e => setForm(f => ({ ...f, special_instructions: e.target.value }))} placeholder="Dietary needs, medications, special care..." className="rounded-xl resize-none" rows={3} />
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1 rounded-xl">Cancel</Button>
                <Button type="submit" disabled={loading || !selectedService || !form.pet_name || !form.owner_email || !form.start_date} className="flex-1 rounded-xl">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Book Now'}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}