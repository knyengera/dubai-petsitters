import AdminUserDetail from "@/components/pages/admin/AdminUserDetail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <AdminUserDetail userId={id} />;
}
