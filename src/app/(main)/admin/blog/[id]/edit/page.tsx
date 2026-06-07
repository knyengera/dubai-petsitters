import AdminBlogEditor from "@/components/pages/admin/AdminBlogEditor";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <AdminBlogEditor postId={id} />;
}
