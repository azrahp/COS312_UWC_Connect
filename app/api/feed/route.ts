import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rankEventsForUser, RawEvent, UserFeedContext } from "@/lib/feed/ranker";

export const dynamic = "force-dynamic";


export async function GET(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "for-you";
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const now = new Date();

    if (tab === "following") {
      if (!sessionUser) {
        return NextResponse.json({ events: [], nextCursor: null });
      }

      // Fetch user's followed accounts
      const follows = await prisma.follow.findMany({
        where: { followerId: sessionUser.id },
        select: { followingId: true },
      });
      const followingIds = follows.map((f) => f.followingId);

      if (followingIds.length === 0) {
        return NextResponse.json({ events: [], nextCursor: null });
      }

      const rawEvents = await prisma.event.findMany({
        where: {
          authorId: { in: followingIds },
          status: "PUBLISHED",
          startsAt: { gte: new Date(now.getTime() - 2 * 3600 * 1000) },
          author: { status: "ACTIVE" },
        },
        include: {
          author: {
            select: { id: true, name: true, email: true, avatarUrl: true, status: true },
          },
          _count: {
            select: { likes: true, rsvps: true, comments: true, shares: true, saves: true },
          },
          rsvps: sessionUser ? { where: { userId: sessionUser.id } } : false,
          likes: sessionUser ? { where: { userId: sessionUser.id } } : false,
          saves: sessionUser ? { where: { userId: sessionUser.id } } : false,
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });

      let nextCursor: string | null = null;
      let eventsToReturn = rawEvents;
      if (rawEvents.length > limit) {
        const nextItem = rawEvents.pop();
        nextCursor = nextItem?.id || null;
        eventsToReturn = rawEvents;
      }

      const formatted = eventsToReturn.map((e) => ({
        ...e,
        isRsvped: Array.isArray(e.rsvps) && e.rsvps.length > 0,
        isLiked: Array.isArray(e.likes) && e.likes.length > 0,
        isSaved: Array.isArray(e.saves) && e.saves.length > 0,
        reason: `From ${e.author.name} (Host you follow)`,
      }));

      return NextResponse.json({ events: formatted, nextCursor });
    }

    // Default "For You" feed logic
    let userContext: UserFeedContext = {
      userId: sessionUser?.id || "guest",
      onboardingInterests: [],
      followingAuthorIds: [],
      pastInteractions: [],
      userRsvpEventIds: [],
      userSavedEventIds: [],
      userLikedEventIds: [],
    };

    if (sessionUser) {
      const currentUser = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        include: {
          following: { select: { followingId: true } },
          interactions: {
            take: 100,
            orderBy: { createdAt: "desc" },
            include: { event: { select: { category: true } } },
          },
          rsvps: { select: { eventId: true } },
          likes: { select: { eventId: true } },
          saves: { select: { eventId: true } },
        },
      });

      if (currentUser) {
        let parsedInterests: string[] = [];
        try {
          parsedInterests = JSON.parse(currentUser.interests || "[]");
        } catch {
          parsedInterests = [];
        }

        userContext = {
          userId: currentUser.id,
          onboardingInterests: parsedInterests,
          followingAuthorIds: currentUser.following.map((f) => f.followingId),
          pastInteractions: currentUser.interactions.map((i) => ({
            eventId: i.eventId,
            category: i.event?.category || "other",
            type: i.type,
            createdAt: i.createdAt,
          })),
          userRsvpEventIds: currentUser.rsvps.map((r) => r.eventId),
          userLikedEventIds: currentUser.likes.map((l) => l.eventId),
          userSavedEventIds: currentUser.saves.map((s) => s.eventId),
        };
      }
    }

    // Fetch candidate events for feed ranking
    const candidateEvents = await prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        author: { status: "ACTIVE" },
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true, status: true },
        },
        _count: {
          select: { likes: true, rsvps: true, comments: true, shares: true, saves: true },
        },
        rsvps: sessionUser ? { where: { userId: sessionUser.id } } : false,
        likes: sessionUser ? { where: { userId: sessionUser.id } } : false,
        saves: sessionUser ? { where: { userId: sessionUser.id } } : false,
      },
      take: 100,
    });

    const rankedEvents = rankEventsForUser(candidateEvents as RawEvent[], userContext, now);

    // Apply cursor-based pagination on ranked events
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = rankedEvents.findIndex((e) => e.id === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginatedEvents = rankedEvents.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < rankedEvents.length;
    const nextCursor = hasMore ? paginatedEvents[paginatedEvents.length - 1]?.id || null : null;

    const formattedEvents = paginatedEvents.map((e) => ({
      ...e,
      isRsvped: sessionUser ? userContext.userRsvpEventIds.includes(e.id) : false,
      isLiked: sessionUser ? userContext.userLikedEventIds.includes(e.id) : false,
      isSaved: sessionUser ? userContext.userSavedEventIds.includes(e.id) : false,
    }));

    return NextResponse.json({
      events: formattedEvents,
      nextCursor,
    });
  } catch (error: any) {
    console.error("Feed API Error:", error);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
