"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/lib/data';
import { useToast } from '@/components/ui/use-toast';
import { BadgeCheck, CheckCircle, Loader2, CreditCard, ArrowRight } from 'lucide-react';

const PAYMENT_METHODS = [
  {
    id: 'paypal',
    label: 'PayPal',
    description: 'Pay securely with your PayPal account or card',
    logo: '🅿️',
    currencies: 'USD / SAR',
  },
  {
    id: 'payfast',
    label: 'PayFast',
    description: 'Fast local payment for Saudi Arabia',
    logo: '⚡',
    currencies: 'SAR',
  },
  {
    id: 'salla',
    label: 'Salla Pay',
    description: 'Trusted Saudi e-commerce payment gateway',
    logo: '🛒',
    currencies: 'SAR',
  },
];

// Extract numeric price from e.g. "SAR 799"
function parsePriceNumber(priceStr) {
  return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
}

export default function AdvertisePaymentModal({ plan, open, onClose }) {
  const [step, setStep] = useState('details'); // 'details' | 'payment' | 'done'
  const [selectedMethod, setSelectedMethod] = useState('');
  const [contact, setContact] = useState({ business_name: '', contact_name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [gatewayUrl, setGatewayUrl] = useState('');
  const { toast } = useToast();

  if (!plan) return null;

  const amount = parsePriceNumber(plan.price);

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePay = async () => {
    if (!selectedMethod) return;
    setLoading(true);

    await base44.entities.Payment.create({
      payment_type: 'vet_subscription',
      gateway: selectedMethod,
      amount,
      currency: 'SAR',
      status: 'pending',
      payer_name: contact.contact_name,
      payer_email: contact.email,
      notes: `Advertising plan: ${plan.name} | Business: ${contact.business_name}`,
    });

    const gatewayUrls = {
      paypal: 'https://www.paypal.com/signin',
      payfast: 'https://www.payfast.co.za',
      salla: 'https://salla.com',
    };

    const url = gatewayUrls[selectedMethod];
    setGatewayUrl(url);
    setLoading(false);
    setStep('done');
    window.open(url, '_blank');
  };

  const handleClose = () => {
    setStep('details');
    setSelectedMethod('');
    setGatewayUrl('');
    setContact({ business_name: '', contact_name: '', email: '', phone: '' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl">
        {step === 'done' ? (
          <div className="text-center py-8">
            <CheckCircle className="w-14 h-14 text-primary mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-bold mb-2">Payment Initiated!</h2>
            <p className="text-muted-foreground text-sm mb-4">
              A new tab should have opened for payment. If it didn't,{' '}
              <a href={gatewayUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold underline">
                click here to pay
              </a>.
              Once confirmed, your <strong>{plan.name}</strong> plan will be activated within 24 hours.
            </p>
            <Button onClick={handleClose} className="rounded-xl w-full">Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">
                {step === 'details' ? 'Subscribe to ' + plan.name : 'Choose Payment Method'}
              </DialogTitle>
            </DialogHeader>

            {/* Plan summary */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 my-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-foreground">{plan.name} Plan</span>
                <span className="font-heading text-xl font-bold text-primary">{plan.price}<span className="text-sm font-normal text-muted-foreground">{plan.period}</span></span>
              </div>
              <ul className="space-y-1">
                {plan.features.slice(0, 3).map(f => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" /> {f}
                  </li>
                ))}
                {plan.features.length > 3 && (
                  <li className="text-xs text-muted-foreground pl-5">+{plan.features.length - 3} more features</li>
                )}
              </ul>
            </div>

            {step === 'details' && (
              <form onSubmit={handleProceedToPayment} className="space-y-4 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="mb-1 block">Business Name *</Label>
                    <Input required value={contact.business_name} onChange={e => setContact(c => ({ ...c, business_name: e.target.value }))} className="rounded-xl" placeholder="Your business name" />
                  </div>
                  <div>
                    <Label className="mb-1 block">Contact Name *</Label>
                    <Input required value={contact.contact_name} onChange={e => setContact(c => ({ ...c, contact_name: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div>
                    <Label className="mb-1 block">Email *</Label>
                    <Input required type="email" value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div className="col-span-2">
                    <Label className="mb-1 block">Phone</Label>
                    <Input value={contact.phone} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))} className="rounded-xl" placeholder="+966 5xx xxx xxxx" />
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="outline" onClick={handleClose} className="flex-1 rounded-xl">Cancel</Button>
                  <Button type="submit" className="flex-1 rounded-xl gap-2">
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            )}

            {step === 'payment' && (
              <div className="space-y-4 pt-1">
                <p className="text-sm text-muted-foreground">Select how you'd like to pay <strong>SAR {amount.toLocaleString()}</strong>:</p>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map(method => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${selectedMethod === method.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                    >
                      <span className="text-2xl">{method.logo}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-foreground">{method.label}</div>
                        <div className="text-xs text-muted-foreground">{method.description}</div>
                      </div>
                      <span className="text-xs text-muted-foreground">{method.currencies}</span>
                      {selectedMethod === method.id && <CheckCircle className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 pt-1">
                  <Button variant="outline" onClick={() => setStep('details')} className="flex-1 rounded-xl">Back</Button>
                  <Button onClick={handlePay} disabled={!selectedMethod || loading} className="flex-1 rounded-xl gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    Pay Now
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}