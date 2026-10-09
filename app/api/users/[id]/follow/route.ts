import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetUserId = params.id;
    if (targetUserId === sessionUser.id) {
      return NextResponse.json({ error: "You cannot follow yourself." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: sessionUser.id,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      await prisma.follow.delete({ where: { id: existingFollow.id } });
      const followersCount = await prisma.follow.count({ where: { followingId: targetUserId } });
      return NextResponse.json({ isFollowing: false, followersCount, message: `Unfollowed ${targetUser.name}` });
    } else {
      await prisma.follow.create({
        data: {
          followerId: sessionUser.id,
          followingId: targetUserId,
        },
      });

      // Notify target user
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          type: "FOLLOW",
          message: `${sessionUser.name} started following you!`,
          linkUrl: `/profile/${sessionUser.id}`,
        },
      });

      const followersCount = await prisma.follow.count({ where: { followingId: targetUserId } });
      return NextResponse.json({ isFollowing: true, followersCount, message: `Now following ${targetUser.name}` });
    }
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to toggle follow" }, { status: 500 });
  }
}
