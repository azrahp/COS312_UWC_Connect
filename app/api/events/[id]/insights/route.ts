import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            likes: true,
            rsvps: true,
            comments: true,
            shares: true,
            saves: true,
            interactions: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.authorId !== sessionUser.id && sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden. Insights reserved for event owner." }, { status: 403 });
    }

    const viewsCount = await prisma.interaction.count({
      where: { eventId: event.id, type: "VIEW" },
    });

    const totalInteractions = event._count.interactions;
    const capacity = event.capacity;
    const rsvpCount = event._count.rsvps;
    const capacityPercentage = capacity ? Math.min(100, Math.round((rsvpCount / capacity) * 100)) : null;

    // Build timeline engagement metrics over past 7 days
    const now = new Date();
    const timeline = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

      const dayViews = await prisma.interaction.count({
        where: { eventId: event.id, type: "VIEW", createdAt: { gte: dayStart, lte: dayEnd } },
      });
      const dayRsvps = await prisma.rsvp.count({
        where: { eventId: event.id, createdAt: { gte: dayStart, lte: dayEnd } },
      });
      const dayLikes = await prisma.like.count({
        where: { eventId: event.id, createdAt: { gte: dayStart, lte: dayEnd } },
      });

      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
      timeline.push({ day: dayLabel, views: dayViews, rsvps: dayRsvps, likes: dayLikes });
    }

    return NextResponse.json({
      insights: {
        eventId: event.id,
        title: event.title,
        views: viewsCount,
        likes: event._count.likes,
        comments: event._count.comments,
        saves: event._count.saves,
        shares: event._count.shares,
        rsvps: rsvpCount,
        capacity,
        capacityPercentage,
        totalInteractions,
        timeline,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch event insights" }, { status: 500 });
  }
}
