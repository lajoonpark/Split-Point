import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: { select: { username: true } },
      // Prisma does not support recursive includes, so this loads 3 levels deep.
      // Deeper nesting requires a recursive SQL query or a separate flatten endpoint.
      nodes: {
        include: {
          author: { select: { username: true } },
          votes: true,
          children: {
            include: {
              author: { select: { username: true } },
              votes: true,
              children: {
                include: {
                  author: { select: { username: true } },
                  votes: true,
                  children: true,
                },
              },
            },
          },
        },
        where: { parentId: null },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}
