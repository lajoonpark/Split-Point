import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") || "new";

  const posts = await prisma.post.findMany({
    include: {
      author: { select: { username: true } },
      _count: { select: { nodes: true } },
      nodes: {
        include: { votes: true },
        where: { parentId: null },
      },
    },
    orderBy: sort === "new" ? { createdAt: "desc" } : { createdAt: "desc" },
  });

  const postsWithScore = posts.map((p) => {
    const score = p.nodes.reduce(
      (sum, n) => sum + n.votes.reduce((s, v) => s + v.value, 0),
      0
    );
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      moderationLevel: p.moderationLevel,
      tags: p.tags,
      createdAt: p.createdAt,
      author: p.author.username,
      nodeCount: p._count.nodes,
      score,
    };
  });

  // Sort
  if (sort === "top") postsWithScore.sort((a, b) => b.score - a.score);
  if (sort === "trending") {
    // Simple trending: score / age in hours
    postsWithScore.sort((a, b) => {
      const ageA = (Date.now() - new Date(a.createdAt).getTime()) / 3600000 + 1;
      const ageB = (Date.now() - new Date(b.createdAt).getTime()) / 3600000 + 1;
      return b.score / ageB - a.score / ageA;
    });
  }

  return NextResponse.json(postsWithScore);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, moderationLevel, tags } = await req.json();
  if (!title)
    return NextResponse.json({ error: "Title required" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const post = await prisma.post.create({
    data: {
      title,
      description: description || null,
      moderationLevel: moderationLevel || "G",
      tags: tags || [],
      authorId: user.id,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
