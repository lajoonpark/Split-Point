import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { nodeId, value } = await req.json();
  if (!nodeId || (value !== 1 && value !== -1))
    return NextResponse.json({ error: "nodeId and value (1 or -1) required" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Upsert: if same vote exists, remove it (toggle off); otherwise upsert
  const existing = await prisma.vote.findUnique({
    where: { userId_nodeId: { userId: user.id, nodeId } },
  });

  if (existing && existing.value === value) {
    // Toggle off
    await prisma.vote.delete({
      where: { userId_nodeId: { userId: user.id, nodeId } },
    });
    return NextResponse.json({ action: "removed" });
  }

  const vote = await prisma.vote.upsert({
    where: { userId_nodeId: { userId: user.id, nodeId } },
    update: { value },
    create: { userId: user.id, nodeId, value },
  });

  return NextResponse.json(vote);
}
