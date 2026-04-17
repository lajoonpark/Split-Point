"use client";
import { useState } from "react";
import { Session } from "next-auth";
import { ReplyBox } from "./DebatePage";

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

interface NodeTreeProps {
  node: NodeData;
  postId: string;
  moderationLevel: string;
  bestPath: string[];
  session: Session | null;
  onUpdate: () => void;
  depth: number;
}

export function NodeTree({
  node,
  postId,
  moderationLevel,
  bestPath,
  session,
  onUpdate,
  depth,
}: NodeTreeProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [replying, setReplying] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);

  const score = node.votes.reduce((s, v) => s + v.value, 0);
  const isOnBestPath = bestPath.includes(node.id);
  const userId = (session?.user as { id?: string })?.id;
  const myVote = userId ? node.votes.find((v) => v.userId === userId)?.value : undefined;

  async function vote(value: 1 | -1) {
    if (!session) return;
    setVoteLoading(true);
    await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodeId: node.id, value }),
    });
    setVoteLoading(false);
    onUpdate();
  }

  // Cap at 8 levels to prevent excessive horizontal scrolling on narrow screens
  const indent = Math.min(depth, 8);

  return (
    <div
      style={{ marginLeft: `${indent * 16}px` }}
      className={`border-l-2 pl-3 py-1 ${
        isOnBestPath ? "border-orange-500/60" : "border-gray-800"
      }`}
    >
      <div
        className={`rounded-lg p-3 ${
          isOnBestPath
            ? "bg-orange-950/20 border border-orange-800/40"
            : "bg-gray-900 border border-gray-800"
        }`}
      >
        {/* Header row */}
        <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-gray-600 hover:text-gray-300 transition-colors mr-1"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? "▶" : "▼"}
          </button>
          <span className="font-medium text-gray-300">
            {node.anonymous ? "Anonymous" : node.author.username}
          </span>
          <span>·</span>
          <span>{new Date(node.createdAt).toLocaleString()}</span>
          {isOnBestPath && (
            <span className="ml-auto text-orange-400 font-semibold">✦ best path</span>
          )}
        </div>

        {!collapsed && (
          <>
            {/* Content with NSFW handling */}
            {node.isNsfw && !session ? (
              <p className="text-gray-600 italic text-sm">
                [NSFW – sign in to view]
              </p>
            ) : node.isNsfw && !revealed ? (
              <div>
                <p className="blur-sm select-none text-sm text-gray-300">{node.content}</p>
                <button
                  onClick={() => setRevealed(true)}
                  className="mt-1 text-xs text-orange-400 hover:text-orange-300"
                >
                  Click to reveal (NSFW)
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-100 whitespace-pre-wrap">{node.content}</p>
            )}

            {/* Vote + reply controls */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => vote(1)}
                  disabled={voteLoading || !session}
                  className={`text-sm px-1.5 py-0.5 rounded transition-colors ${
                    myVote === 1
                      ? "text-orange-400"
                      : "text-gray-500 hover:text-orange-400"
                  } disabled:opacity-40`}
                >
                  ▲
                </button>
                <span className={`text-xs font-medium ${
                  score > 0 ? "text-orange-400" : score < 0 ? "text-blue-400" : "text-gray-400"
                }`}>
                  {score}
                </span>
                <button
                  onClick={() => vote(-1)}
                  disabled={voteLoading || !session}
                  className={`text-sm px-1.5 py-0.5 rounded transition-colors ${
                    myVote === -1
                      ? "text-blue-400"
                      : "text-gray-500 hover:text-blue-400"
                  } disabled:opacity-40`}
                >
                  ▼
                </button>
              </div>
              {session && (
                <button
                  onClick={() => setReplying((r) => !r)}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {replying ? "Cancel" : "Reply"}
                </button>
              )}
              {node.children.length > 0 && (
                <span className="text-xs text-gray-600">
                  {node.children.length} repl{node.children.length === 1 ? "y" : "ies"}
                </span>
              )}
            </div>

            {replying && (
              <div className="mt-2">
                <ReplyBox
                  postId={postId}
                  parentId={node.id}
                  moderationLevel={moderationLevel}
                  onSubmit={() => { setReplying(false); onUpdate(); }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Children */}
      {!collapsed && node.children.map((child) => (
        <NodeTree
          key={child.id}
          node={child}
          postId={postId}
          moderationLevel={moderationLevel}
          bestPath={bestPath}
          session={session}
          onUpdate={onUpdate}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
