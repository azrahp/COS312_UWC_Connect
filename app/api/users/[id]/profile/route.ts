import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    const userId = params.id === "me" && sessionUser ? sessionUser.id : params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        bio: true,
        role: true,
        faculty: true,
        yearOfStudy: true,
        studentStaffNumber: true,
        interests: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            events: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isSelf = sessionUser?.id === user.id;

    // Fetch published events (or published + drafts if viewing self)
    const eventWhere: any = {
      authorId: user.id,
      status: isSelf ? { in: ["PUBLISHED", "DRAFT"] } : "PUBLISHED",
    };

    const userEvents = await prisma.event.findMany({
      where: eventWhere,
      include: {
        _count: { select: { likes: true, rsvps: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const isFollowing = sessionUser && !isSelf
      ? (await prisma.follow.count({
          where: { followerId: sessionUser.id, followingId: user.id },
        })) > 0
      : false;

    let parsedInterests: string[] = [];
    try {
      parsedInterests = JSON.parse(user.interests || "[]");
    } catch {
      parsedInterests = [];
    }

    return NextResponse.json({
      profile: {
        ...user,
        interests: parsedInterests,
        isSelf,
        isFollowing,
        eventsCount: user._count.events,
        followersCount: user._count.followers,
        followingCount: user._count.following,
      },
      events: userEvents,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
