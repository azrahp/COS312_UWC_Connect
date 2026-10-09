import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";


export async function GET(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    const { searchParams } = new URL(req.url);

    const query = searchParams.get("query") || "";
    const category = searchParams.get("category");
    const timeFilter = searchParams.get("timeFilter"); // 'today' | 'this-week' | 'saved'
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const now = new Date();
    const where: any = {
      status: "PUBLISHED",
      author: { status: "ACTIVE" },
    };

    if (query.trim()) {
      where.OR = [
        { title: { contains: query.trim(), mode: "insensitive" } },
        { description: { contains: query.trim(), mode: "insensitive" } },
        { location: { contains: query.trim(), mode: "insensitive" } },
        { category: { contains: query.trim(), mode: "insensitive" } },
        { category: { contains: query.trim() } },
      ];
    }

    if (category && category !== "all") {
      where.category = category.toLowerCase();
    }

    if (timeFilter === "today") {
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);
      where.startsAt = {
        gte: new Date(now.getTime() - 2 * 3600 * 1000),
        lte: endOfToday,
      };
    } else if (timeFilter === "this-week") {
      const endOfWeek = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
      where.startsAt = {
        gte: new Date(now.getTime() - 2 * 3600 * 1000),
        lte: endOfWeek,
      };
    } else if (timeFilter === "saved" && sessionUser) {
      const saved = await prisma.save.findMany({
        where: { userId: sessionUser.id },
        select: { eventId: true },
      });
      where.id = { in: saved.map((s) => s.eventId) };
    }

    const events = await prisma.event.findMany({
      where,
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
      orderBy: { startsAt: "asc" },
      take: limit,
    });

    const formatted = events.map((e) => ({
      ...e,
      isRsvped: Array.isArray(e.rsvps) && e.rsvps.length > 0,
      isLiked: Array.isArray(e.likes) && e.likes.length > 0,
      isSaved: Array.isArray(e.saves) && e.saves.length > 0,
    }));

    return NextResponse.json({ events: formatted });
  } catch (error: any) {
    console.error("Get Events Error:", error);
    return NextResponse.json({ error: "Failed to search events" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, category, location, startsAt, imageUrl, capacity, externalUrl, status } = body;

    if (!title || !description || !category || !location || !startsAt) {
      return NextResponse.json(
        { error: "Title, description, category, location, and date/time are required." },
        { status: 400 }
      );
    }

    const parsedCapacity = capacity ? parseInt(capacity, 10) : null;
    if (parsedCapacity !== null && (isNaN(parsedCapacity) || parsedCapacity <= 0)) {
      return NextResponse.json(
        { error: "RSVP Capacity must be a positive number." },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        authorId: sessionUser.id,
        title: title.trim(),
        description: description.trim(),
        category: category.toLowerCase().trim(),
        location: location.trim(),
        startsAt: new Date(startsAt),
        imageUrl: imageUrl || null,
        capacity: parsedCapacity,
        externalUrl: externalUrl || null,
        status: status === "DRAFT" ? "DRAFT" : "PUBLISHED",
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    // Notify followers if event is PUBLISHED
    if (event.status === "PUBLISHED") {
      const followers = await prisma.follow.findMany({
        where: { followingId: sessionUser.id },
        select: { followerId: true },
      });

      if (followers.length > 0) {
        await prisma.notification.createMany({
          data: followers.map((f) => ({
            userId: f.followerId,
            type: "FOLLOW_POST",
            message: `${sessionUser.name} posted a new event: ${event.title}`,
            linkUrl: `/events/${event.id}`,
          })),
        });
      }
    }

    return NextResponse.json({ event, message: "Event created successfully!" });
  } catch (error: any) {
    console.error("Create Event Error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
