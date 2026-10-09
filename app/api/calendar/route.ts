import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_RANGE_DAYS = 62;

/**
 * GET /api/calendar?from=ISO&to=ISO&filter=all|rsvp|saved
 *
 * Returns published events that start inside [from, to). The calendar page
 * sends the exact visible grid range (in the viewer's local time), so events
 * are always placed on the correct day regardless of server timezone.
 */
export async function GET(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    const { searchParams } = new URL(req.url);

    const from = new Date(searchParams.get("from") || "");
    const to = new Date(searchParams.get("to") || "");
    const filter = searchParams.get("filter") || "all";

    if (isNaN(from.getTime()) || isNaN(to.getTime()) || to <= from) {
      return NextResponse.json(
        { error: "Valid 'from' and 'to' dates are required." },
        { status: 400 }
      );
    }

    const rangeDays = (to.getTime() - from.getTime()) / (24 * 3600 * 1000);
    if (rangeDays > MAX_RANGE_DAYS) {
      return NextResponse.json(
        { error: `Date range cannot exceed ${MAX_RANGE_DAYS} days.` },
        { status: 400 }
      );
    }

    if ((filter === "rsvp" || filter === "saved") && !sessionUser) {
      return NextResponse.json(
        { error: "Please log in to use this filter." },
        { status: 401 }
      );
    }

    const where: any = {
      status: "PUBLISHED",
      author: { status: "ACTIVE" },
      startsAt: { gte: from, lt: to },
    };

    if (filter === "rsvp" && sessionUser) {
      where.rsvps = { some: { userId: sessionUser.id } };
    } else if (filter === "saved" && sessionUser) {
      where.saves = { some: { userId: sessionUser.id } };
    }

    const events = await prisma.event.findMany({
      where,
      select: {
        id: true,
        title: true,
        category: true,
        location: true,
        startsAt: true,
        capacity: true,
        author: { select: { id: true, name: true } },
        _count: { select: { rsvps: true } },
        rsvps: sessionUser
          ? { where: { userId: sessionUser.id }, select: { id: true } }
          : false,
        saves: sessionUser
          ? { where: { userId: sessionUser.id }, select: { id: true } }
          : false,
      },
      orderBy: { startsAt: "asc" },
    });

    const formatted = events.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      location: e.location,
      startsAt: e.startsAt,
      capacity: e.capacity,
      author: e.author,
      rsvpCount: e._count.rsvps,
      isRsvped: Array.isArray(e.rsvps) && e.rsvps.length > 0,
      isSaved: Array.isArray(e.saves) && e.saves.length > 0,
    }));

    return NextResponse.json({ events: formatted });
  } catch (error: any) {
    console.error("Calendar Events Error:", error);
    return NextResponse.json(
      { error: "Failed to load calendar events" },
      { status: 500 }
    );
  }
}
