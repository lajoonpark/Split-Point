import { DebatePage } from "@/components/DebatePage";

export default async function DebateRoute({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  return <DebatePage postId={postId} />;
}
