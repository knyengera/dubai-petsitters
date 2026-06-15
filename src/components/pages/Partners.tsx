"use client";

import React, { useEffect, useState } from "react";
import { entities } from "@/lib/data/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import {
  Stethoscope,
  Store,
  Shield,
  Scissors,
  GraduationCap,
  PawPrint,
  Globe,
  BadgeCheck,
  Loader2,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import PaymentModal from "@/components/payment/PaymentModal";
import ImageUpload from "@/components/common/ImageUpload";
import PartnerTypeFields from "@/components/partners/PartnerTypeFields";
import { createPartnerAdvertisingPayment } from "@/lib/monetisation/actions";
import { getActiveAdvertisingPlans } from "@/lib/partners/actions";
import {
  ADVERTISING_PLAN_HIGHLIGHT_STYLES,
  formatAdvertisingPlanPrice,
  type AdvertisingPlan,
} from "@/lib/partners/advertising-plans";
import {
  PARTNER_TYPES,
  SAUDI_CITIES,
  getDefaultBusinessDetails,
  getPartnerTypeLabel,
  validateBusinessDetails,
  type BusinessDetails,
  type PartnerTypeId,
} from "@/lib/partners/partner-types";

const PARTNER_ICONS: Record<PartnerTypeId, LucideIcon> = {
  "vet-clinics": Stethoscope,
  "pet-shops": Store,
  "pet-insurance": Shield,
  groomers: Scissors,
  trainers: GraduationCap,
  breeders: PawPrint,
  other: Globe,
};

const stats = [
  { num: "12,000+", label: "Active Pet Owners" },
  { num: "350+", label: "Vet Connections" },
  { num: "15", label: "Saudi Cities" },
  { num: "4.9★", label: "Platform Rating" },
];

type PartnersProps = {
  initialBusinessType?: PartnerTypeId | null;
};

const emptyForm = {
  business_name: "",
  contact_name: "",
  email: "",
  phone: "",
  city: "",
  website: "",
  image_url: "",
  plan: "",
};

export default function Partners({ initialBusinessType = null }: PartnersProps) {
  const { toast } = useToast();
  const [adPlans, setAdPlans] = useState<AdvertisingPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<AdvertisingPlan | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [inquiryId, setInquiryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [businessTypeId, setBusinessTypeId] = useState<PartnerTypeId | "">(
    initialBusinessType ?? ""
  );
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>({});
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    getActiveAdvertisingPlans()
      .then(setAdPlans)
      .finally(() => setPlansLoading(false));
  }, []);

  const handleSelectPlan = (plan: AdvertisingPlan) => {
    setSelectedPlan(plan);
    setForm((f) => ({ ...f, plan: plan.name }));
    document.getElementById("partner-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSelectBusinessType = (typeId: PartnerTypeId) => {
    setBusinessTypeId(typeId);
    setBusinessDetails(getDefaultBusinessDetails(typeId));
    setDetailErrors({});
    document.getElementById("partner-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleBusinessTypeChange = (typeId: string) => {
    if (!typeId) {
      setBusinessTypeId("");
      setBusinessDetails({});
      setDetailErrors({});
      return;
    }
    const id = typeId as PartnerTypeId;
    setBusinessTypeId(id);
    setBusinessDetails(getDefaultBusinessDetails(id));
    setDetailErrors({});
  };

  const resetForm = () => {
    setForm(emptyForm);
    setBusinessTypeId(initialBusinessType ?? "");
    setBusinessDetails(initialBusinessType ? getDefaultBusinessDetails(initialBusinessType) : {});
    setDetailErrors({});
    setSelectedPlan(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlan) {
      toast({
        title: "Select a plan",
        description: "Please choose an advertising plan before proceeding to payment.",
        variant: "destructive",
      });
      return;
    }

    if (!businessTypeId) {
      toast({
        title: "Select a business type",
        description: "Please choose your business type from the dropdown.",
        variant: "destructive",
      });
      return;
    }

    if (!form.image_url) {
      toast({
        title: "Business photo required",
        description: "Please upload a photo of your business. Sign in if you have not already.",
        variant: "destructive",
      });
      return;
    }

    const validation = validateBusinessDetails(businessTypeId, businessDetails);
    if (!validation.success) {
      setDetailErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      toast({
        title: "Missing information",
        description: firstError ?? "Please complete all required business details.",
        variant: "destructive",
      });
      return;
    }

    setDetailErrors({});
    setLoading(true);
    try {
      const inquiry = await entities.PartnerInquiry.create({
        business_name: form.business_name,
        business_type: getPartnerTypeLabel(businessTypeId),
        contact_name: form.contact_name,
        email: form.email,
        phone: form.phone || null,
        city: form.city,
        website: form.website || null,
        image_url: form.image_url,
        plan: form.plan,
        message: `Advertising plan signup for ${selectedPlan.name}`,
        business_details: validation.data,
        status: "new",
      });
      setInquiryId(String(inquiry.id));
      setShowPayment(true);
    } catch (err) {
      toast({
        title: "Submission failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayConfirm = async (gateway: string) => {
    if (!inquiryId || !selectedPlan) throw new Error("Payment setup incomplete");

    const result = await createPartnerAdvertisingPayment({
      inquiryId,
      gateway,
      amount: selectedPlan.amount,
      payerName: form.contact_name,
      payerEmail: form.email,
      notes: `Advertising plan: ${selectedPlan.name} | Business: ${form.business_name}`,
      currency: selectedPlan.currency,
    });

    if (result.ok === false) {
      toast({ title: "Payment setup failed", description: result.error, variant: "destructive" });
      throw new Error(result.error);
    }

    return { paymentId: String(result.data.id) };
  };

  const handlePaymentComplete = () => {
    toast({
      title: "Payment submitted",
      description: `Your ${selectedPlan?.name} plan will be activated once payment is confirmed.`,
    });
    setShowPayment(false);
    setInquiryId(null);
    resetForm();
  };

  const paymentSummary = selectedPlan
    ? {
        title: `${selectedPlan.name} Advertising Plan`,
        lines: [
          { label: "Plan", value: selectedPlan.name },
          { label: "Business", value: form.business_name || "—" },
        ],
        total: formatAdvertisingPlanPrice(selectedPlan),
      }
    : undefined;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-heading text-2xl font-extrabold">{s.num}</div>
              <div className="text-sm text-primary-foreground/80">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl font-bold text-foreground mb-2">Who Can Partner With Us?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We welcome all pet-related businesses looking to grow their customer base in Saudi Arabia.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-16">
          {PARTNER_TYPES.map((p, i) => {
            const Icon = PARTNER_ICONS[p.id];
            const isSelected = businessTypeId === p.id;
            return (
              <motion.button
                key={p.id}
                type="button"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                onClick={() => handleSelectBusinessType(p.id)}
                className={`text-left bg-card border rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all ${
                  isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-foreground mb-1 text-sm sm:text-base">{p.label}</h3>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </motion.button>
            );
          })}
        </div>

        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl font-bold text-foreground mb-2">Advertising Plans</h2>
          <p className="text-muted-foreground">Flexible options to fit every business size and budget.</p>
        </div>

        {plansLoading ? (
          <div className="flex justify-center py-16 mb-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : adPlans.length === 0 ? (
          <div className="text-center py-16 mb-16 text-muted-foreground">
            Advertising plans are not available right now. Please check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {adPlans.map((plan, i) => {
              const isSelected = selectedPlan?.id === plan.id;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div
                    className={`relative bg-card border-2 ${isSelected ? "border-primary ring-2 ring-primary/20" : ADVERTISING_PLAN_HIGHLIGHT_STYLES[plan.highlight]} rounded-2xl p-6 h-full flex flex-col ${plan.badge ? "shadow-xl" : ""}`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow">
                          {plan.badge}
                        </span>
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute -top-3 right-4">
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow">
                          Selected
                        </span>
                      </div>
                    )}
                    <div className="mb-4">
                      <h3 className="font-heading text-xl font-bold text-foreground">{plan.name}</h3>
                      <div className="flex items-end gap-1 mt-1">
                        <span className="font-heading text-3xl font-extrabold text-primary">
                          {formatAdvertisingPlanPrice(plan)}
                        </span>
                        <span className="text-sm text-muted-foreground mb-1">{plan.period_label}</span>
                      </div>
                    </div>
                    <ul className="space-y-2 flex-1 mb-6">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                          <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full rounded-xl ${plan.badge && !isSelected ? "bg-primary text-primary-foreground" : ""}`}
                      variant={isSelected ? "default" : plan.badge ? "default" : "outline"}
                    >
                      {isSelected ? "Selected" : "Select"} <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div id="partner-form" className="max-w-2xl mx-auto">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2 text-center">Business Details</h2>
          <p className="text-muted-foreground text-center mb-8">
            Enter your business information and complete payment for your selected advertising plan.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5 bg-card border border-border rounded-2xl p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Business Name *</Label>
                <Input
                  required
                  value={form.business_name}
                  onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
                  className="rounded-xl mt-1"
                  placeholder="Your clinic / shop name"
                />
              </div>
              <div>
                <Label>Business Type *</Label>
                <select
                  required
                  value={businessTypeId}
                  onChange={(e) => handleBusinessTypeChange(e.target.value)}
                  className="mt-1 w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select business type</option>
                  {PARTNER_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Contact Name *</Label>
                <Input
                  required
                  value={form.contact_name}
                  onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="rounded-xl mt-1"
                />
              </div>
              <div>
                <Label>City *</Label>
                <select
                  required
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="mt-1 w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select city</option>
                  {SAUDI_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label>Website</Label>
                <Input
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  className="rounded-xl mt-1"
                  placeholder="https://"
                />
              </div>
              <div className="sm:col-span-2 flex flex-col">
                <Label className="mb-2">Business Photo *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  This image appears on your partner listing, similar to clinic photos on vet profiles.
                </p>
                <ImageUpload
                  value={form.image_url}
                  onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
                  category="partners"
                  label="Upload Business Photo"
                  variant="wide"
                  className="w-full"
                />
              </div>
            </div>

            {businessTypeId && (
              <PartnerTypeFields
                businessTypeId={businessTypeId}
                details={businessDetails}
                onChange={setBusinessDetails}
                errors={detailErrors}
              />
            )}

            {selectedPlan && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-2 text-sm text-primary font-medium">
                Selected Plan: <strong>{selectedPlan.name}</strong> — {formatAdvertisingPlanPrice(selectedPlan)}
                {selectedPlan.period_label}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading || !selectedPlan}
              className="w-full rounded-xl bg-primary h-12 font-bold text-base"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <CreditCard className="w-5 h-5 mr-2" />
              )}
              Proceed to Payment
            </Button>
          </form>
        </div>
      </div>

      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        summary={paymentSummary}
        onConfirm={handlePayConfirm}
        onComplete={handlePaymentComplete}
      />
    </div>
  );
}
