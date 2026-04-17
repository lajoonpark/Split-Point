import { CreatePostForm } from "@/components/CreatePostForm";

export default function CreatePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New Debate</h1>
      <CreatePostForm />
    </div>
  );
}
