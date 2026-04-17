"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type SortOption = "new" | "top" | "trending";

type PostSummary = {
  id: string;
  title: string;
  description?: string;
  moderationLevel: string;
  tags: string[];
  createdAt: string;
  author: string;
  nodeCount: number;
  score: number;
};

export function HomeFeed() {
  const [sort, setSort] = useState<SortOption>("new");
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/posts?sort=${sort}`)
      .then((r) => r.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      });
  }, [sort]);

  const sortButtons: { key: SortOption; label: string }[] = [
    { key: "trending", label: "🔥 Trending" },
    { key: "new", label: "✨ New" },
    { key: "top", label: "⬆ Top" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-white">
          Debates
        </h1>
        <div className="flex gap-2">
          {sortButtons.map((b) => (
            <button
              key={b.key}
              onClick={() => setSort(b.key)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                sort === b.key
                  ? "bg-orange-500 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading…</div>
      ) : posts.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          No debates yet.{" "}
          <Link href="/create" className="text-orange-400 hover:text-orange-300">
            Start one!
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/debate/${post.id}`}
              className="block bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-orange-500/50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      post.moderationLevel === "G" ? "bg-green-900/50 text-green-400" :
                      post.moderationLevel === "PG" ? "bg-yellow-900/50 text-yellow-400" :
                      "bg-red-900/50 text-red-400"
                    }`}>
                      {post.moderationLevel}
                    </span>
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-lg font-semibold text-white group-hover:text-orange-400 transition-colors truncate">
                    {post.title}
                  </h2>
                  {post.description && (
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">{post.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>by {post.author}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0 text-sm">
                  <span className={`font-bold ${post.score > 0 ? "text-orange-400" : post.score < 0 ? "text-blue-400" : "text-gray-400"}`}>
                    {post.score > 0 ? "+" : ""}{post.score}
                  </span>
                  <span className="text-gray-500 text-xs">{post.nodeCount} args</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
