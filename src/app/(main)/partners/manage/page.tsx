import ManageBillingButton from "@/components/partners/ManageBillingButton";

export const metadata = {
  title: "Manage your partner subscription",
};

export default function PartnerManageBillingPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="font-heading text-2xl font-bold">Manage your subscription</h1>
        <p className="text-sm text-muted-foreground">
          Open the secure billing portal to update your payment method, view
          invoices, or cancel your advertising plan. Sign in with the email you
          used to subscribe.
        </p>
        <div className="pt-2">
          <ManageBillingButton label="Open billing portal" variant="default" className="w-full" />
        </div>
      </div>
    </div>
  );
}
