import AdminPetDetail from "@/components/pages/admin/AdminPetDetail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <AdminPetDetail petId={id} />;
}
