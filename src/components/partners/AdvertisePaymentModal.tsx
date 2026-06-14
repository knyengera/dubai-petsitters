"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { entities } from '@/lib/data/entities';
import { useToast } from '@/components/ui/use-toast';
import { BadgeCheck, ArrowRight } from 'lucide-react';
import PaymentModal from '@/components/payment/PaymentModal';
import { createPartnerAdvertisingPayment } from '@/lib/monetisation/actions';
import { DEFAULT_CURRENCY } from '@/lib/monetisation/constants';
import {
  formatAdvertisingPlanPrice,
  type AdvertisingPlan,
} from '@/lib/partners/advertising-plans';

type AdvertisePaymentModalProps = {
  plan: AdvertisingPlan | null;
  open: boolean;
  onClose: () => void;
};

export default function AdvertisePaymentModal({ plan, open, onClose }: AdvertisePaymentModalProps) {
  const [contact, setContact] = useState({ business_name: '', contact_name: '', email: '', phone: '' });
  const [inquiryId, setInquiryId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const { toast } = useToast();

  if (!plan) return null;

  const amount = Number(plan.amount);
  const priceLabel = formatAdvertisingPlanPrice(plan);

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const inquiry = await entities.PartnerInquiry.create({
        business_name: contact.business_name,
        contact_name: contact.contact_name,
        email: contact.email,
        phone: contact.phone || null,
        plan: plan.name,
        message: `Advertising plan signup for ${plan.name}`,
        status: 'new',
      });
      setInquiryId(String(inquiry.id));
      setShowPayment(true);
    } catch (err) {
      toast({
        title: 'Submission failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePayConfirm = async (gateway: string) => {
    if (!inquiryId) throw new Error('Inquiry not found');
    const result = await createPartnerAdvertisingPayment({
      inquiryId,
      gateway,
      amount,
      payerName: contact.contact_name,
      payerEmail: contact.email,
      notes: `Advertising plan: ${plan.name} | Business: ${contact.business_name}`,
      currency: plan.currency || DEFAULT_CURRENCY,
    });
    if (result.ok === false) {
      toast({ title: 'Payment setup failed', description: result.error, variant: 'destructive' });
      throw new Error(result.error);
    }
    return { paymentId: String(result.data.id) };
  };

  const handlePaymentComplete = () => {
    toast({
      title: 'Payment submitted',
      description: `Your ${plan.name} plan will be activated once payment is confirmed.`,
    });
    handleClose();
  };

  const handleClose = () => {
    setInquiryId(null);
    setShowPayment(false);
    setContact({ business_name: '', contact_name: '', email: '', phone: '' });
    onClose();
  };

  const paymentSummary = {
    title: `${plan.name} Advertising Plan`,
    lines: [
      { label: 'Plan', value: plan.name },
      { label: 'Business', value: contact.business_name || '—' },
    ],
    total: priceLabel,
  };

  return (
    <>
      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        summary={paymentSummary}
        onConfirm={handlePayConfirm}
        onComplete={handlePaymentComplete}
      />
      <Dialog open={open && !showPayment} onOpenChange={handleClose}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              Subscribe to {plan.name}
            </DialogTitle>
          </DialogHeader>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 my-2">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-foreground">{plan.name} Plan</span>
              <span className="font-heading text-xl font-bold text-primary">
                {priceLabel}
                <span className="text-sm font-normal text-muted-foreground">{plan.period_label}</span>
              </span>
            </div>
            <ul className="space-y-1">
              {plan.features.slice(0, 3).map((f: string) => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" /> {f}
                </li>
              ))}
              {plan.features.length > 3 && (
                <li className="text-xs text-muted-foreground pl-5">
                  +{plan.features.length - 3} more features
                </li>
              )}
            </ul>
          </div>

          <form onSubmit={handleProceedToPayment} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="mb-1 block">Business Name *</Label>
                <Input
                  required
                  value={contact.business_name}
                  onChange={(e) => setContact((c) => ({ ...c, business_name: e.target.value }))}
                  className="rounded-xl"
                  placeholder="Your business name"
                />
              </div>
              <div>
                <Label className="mb-1 block">Contact Name *</Label>
                <Input
                  required
                  value={contact.contact_name}
                  onChange={(e) => setContact((c) => ({ ...c, contact_name: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="mb-1 block">Email *</Label>
                <Input
                  required
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="col-span-2">
                <Label className="mb-1 block">Phone</Label>
                <Input
                  value={contact.phone}
                  onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                  className="rounded-xl"
                  placeholder="+966 5xx xxx xxxx"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1 rounded-xl">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 rounded-xl gap-2">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
