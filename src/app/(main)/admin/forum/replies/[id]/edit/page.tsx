import AdminForumEditor from "@/components/pages/admin/AdminForumEditor";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <AdminForumEditor recordType="replies" recordId={id} />;
}
