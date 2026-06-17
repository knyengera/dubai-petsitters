import AdminLostPetDetail from "@/components/pages/admin/AdminLostPetDetail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <AdminLostPetDetail reportId={id} />;
}
