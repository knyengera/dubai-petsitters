import AdminBookingDetail from "@/components/pages/admin/AdminBookingDetail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <AdminBookingDetail bookingId={id} />;
}
