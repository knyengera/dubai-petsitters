"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, ExternalLink } from 'lucide-react';

const GATEWAYS = [
  {
    id: 'paypal',
    name: 'PayPal',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/124px-PayPal.svg.png',
    desc: 'Pay securely with PayPal',
    currencies: 'USD / SAR',
  },
  {
    id: 'payfast',
    name: 'PayFast',
    logo: 'https://www.payfast.co.za/assets/images/logo/payfast-logo.svg',
    desc: 'South Africa\'s leading payment gateway',
    currencies: 'ZAR / SAR',
  },
  {
    id: 'salla',
    name: 'Salla',
    logo: 'https://salla.com/assets/images/brand/salla-logo.svg',
    desc: 'Saudi Arabia\'s trusted checkout',
    currencies: 'SAR',
  },
];

const GATEWAY_URLS = {
  paypal: 'https://www.paypal.com/checkoutnow',
  payfast: 'https://www.payfast.co.za/eng/process',
  salla: 'https://checkout.salla.sa/',
};

export default function PaymentModal({ open, onClose, summary, onConfirm }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handlePay = async () => {
    if (!selected) return;
    setLoading(true);
    await onConfirm(selected);
    setLoading(false);
    setDone(true);
    // Redirect to gateway in new tab (placeholder until credentials are added)
    window.open(GATEWAY_URLS[selected], '_blank');
  };

  const handleClose = () => {
    setSelected(null);
    setDone(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Complete Payment</DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle className="w-14 h-14 text-primary mx-auto" />
            <p className="font-heading font-bold text-lg text-foreground">Payment Initiated!</p>
            <p className="text-sm text-muted-foreground">You've been redirected to {GATEWAYS.find(g => g.id === selected)?.name} to complete payment. Your booking is confirmed once payment clears.</p>
            <Button onClick={handleClose} className="rounded-xl w-full mt-2">Done</Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Summary */}
            <div className="bg-secondary rounded-xl p-4 space-y-2 text-sm">
              <p className="font-semibold text-foreground text-base">{summary?.title}</p>
              {summary?.lines?.map((line, i) => (
                <div key={i} className="flex justify-between text-muted-foreground">
                  <span>{line.label}</span>
                  <span className="font-medium text-foreground">{line.value}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground">
                <span>Total Due Now</span>
                <span className="text-primary text-lg">{summary?.total}</span>
              </div>
            </div>

            {/* Gateway selector */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Select Payment Method</p>
              <div className="space-y-2">
                {GATEWAYS.map(gw => (
                  <button
                    key={gw.id}
                    onClick={() => setSelected(gw.id)}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl border-2 transition-all text-left ${
                      selected === gw.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/40'
                    }`}
                  >
                    <img src={gw.logo} alt={gw.name} className="h-7 w-20 object-contain" onError={e => e.target.style.display='none'} />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">{gw.name}</p>
                      <p className="text-xs text-muted-foreground">{gw.desc}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{gw.currencies}</Badge>
                    {selected === gw.id && <CheckCircle className="w-5 h-5 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handlePay}
              disabled={!selected || loading}
              className="w-full rounded-xl h-11 font-bold"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
              Pay Now via {selected ? GATEWAYS.find(g => g.id === selected)?.name : '...'}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              You'll be redirected to the payment gateway to complete your transaction securely.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}