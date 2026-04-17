"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { NodeTree } from "./NodeTree";
import { computeBestPath, NodeWithScore } from "@/lib/bestPath";

type VoteData = { id: string; value: number; userId: string };
type NodeData = {
  id: string;
  content: string;
  anonymous: boolean;
  isNsfw: boolean;
  createdAt: string;
  author: { username: string };
  votes: VoteData[];
  children: NodeData[];
  parentId: string | null;
};

type PostData = {
  id: string;
  title: string;
  description?: string;
  moderationLevel: string;
  tags: string[];
  createdAt: string;
  author: { username: string };
  nodes: NodeData[];
};

function buildScoreTree(nodes: NodeData[]): NodeWithScore[] {
  return nodes.map((n) => ({
    id: n.id,
    score: n.votes.reduce((s, v) => s + v.value, 0),
    children: buildScoreTree(n.children),
  }));
}

export function DebatePage({ postId }: { postId: string }) {
  const { data: session } = useSession();
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPost = useCallback(async () => {
    const res = await fetch(`/api/posts/${postId}`);
    if (res.ok) {
      const data: PostData = await res.json();
      setPost(data);
    }
    setLoading(false);
  }, [postId]);

  useEffect(() => { loadPost(); }, [loadPost]);

  // Memoize score tree and best path so they only recompute when post data changes,
  // not on every re-render triggered by session or other state.
  const bestPath = useMemo(
    () => (post ? computeBestPath(buildScoreTree(post.nodes)) : []),
    [post]
  );

  if (loading) return <div className="text-center text-gray-500 py-12">Loading debate…</div>;
  if (!post) return <div className="text-center text-red-400 py-12">Debate not found.</div>;

  return (
    <div>
      {/* Trunk post header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
            post.moderationLevel === "G" ? "bg-green-900/50 text-green-400" :
            post.moderationLevel === "PG" ? "bg-yellow-900/50 text-yellow-400" :
            "bg-red-900/50 text-red-400"
          }`}>
            {post.moderationLevel}
          </span>
          {post.tags.map((t) => (
            <span key={t} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{t}</span>
          ))}
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-2">{post.title}</h1>
        {post.description && <p className="text-gray-300 mb-3">{post.description}</p>}
        <div className="text-xs text-gray-500">
          by {post.author.username} · {new Date(post.createdAt).toLocaleString()}
        </div>
      </div>

      {/* Best path notice */}
      {bestPath.length > 0 && (
        <div className="mb-4 p-3 bg-orange-950/40 border border-orange-800/40 rounded-lg text-sm text-orange-300">
          ✦ Best argument path is highlighted in orange
        </div>
      )}

      {/* Argument tree */}
      <div className="space-y-1">
        {post.nodes.map((node) => (
          <NodeTree
            key={node.id}
            node={node}
            postId={postId}
            moderationLevel={post.moderationLevel}
            bestPath={bestPath}
            session={session}
            onUpdate={loadPost}
            depth={0}
          />
        ))}
      </div>

      {/* Root-level reply box */}
      {session && (
        <div className="mt-6">
          <ReplyBox
            postId={postId}
            parentId={null}
            moderationLevel={post.moderationLevel}
            onSubmit={loadPost}
          />
        </div>
      )}
      {!session && (
        <p className="mt-6 text-center text-gray-500 text-sm">
          Sign in to join the debate.
        </p>
      )}
    </div>
  );
}

export function ReplyBox({
  postId,
  parentId,
  moderationLevel,
  onSubmit,
}: {
  postId: string;
  parentId: string | null;
  moderationLevel: string;
  onSubmit: () => void;
}) {
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/nodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, parentId, content, anonymous }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Failed to post");
    } else {
      setContent("");
      onSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-700 rounded-lg p-3 space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add your argument…"
        rows={3}
        className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="accent-orange-500"
          />
          Post anonymously
        </label>
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded-md font-medium transition-colors"
        >
          {loading ? "Posting…" : "Reply"}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </form>
  );
}
