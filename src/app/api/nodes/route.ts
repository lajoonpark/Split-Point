import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { moderateContent } from "@/lib/moderation";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId, parentId, content, anonymous } = await req.json();
  if (!postId || !content)
    return NextResponse.json({ error: "postId and content required" }, { status: 400 });

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const modResult = moderateContent(content, post.moderationLevel);
  if (!modResult.allowed)
    return NextResponse.json({ error: modResult.reason }, { status: 422 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const node = await prisma.node.create({
    data: {
      content,
      anonymous: anonymous ?? false,
      isNsfw: modResult.isNsfw,
      postId,
      parentId: parentId || null,
      authorId: user.id,
    },
    include: {
      author: { select: { username: true } },
      votes: true,
    },
  });

  return NextResponse.json(node, { status: 201 });
}
