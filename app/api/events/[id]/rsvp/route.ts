import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized. Please log in to RSVP." }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { rsvps: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const existingRsvp = await prisma.rsvp.findUnique({
      where: {
        userId_eventId: {
          userId: sessionUser.id,
          eventId: params.id,
        },
      },
    });

    if (existingRsvp) {
      // Cancel RSVP
      await prisma.rsvp.delete({
        where: { id: existingRsvp.id },
      });

      const updatedCount = await prisma.rsvp.count({ where: { eventId: params.id } });
      const spotsLeft = event.capacity ? Math.max(0, event.capacity - updatedCount) : null;

      return NextResponse.json({
        isRsvped: false,
        rsvpCount: updatedCount,
        spotsLeft,
        isFull: event.capacity ? updatedCount >= event.capacity : false,
        message: "RSVP cancelled",
      });
    } else {
      // Check Capacity
      if (event.capacity && event._count.rsvps >= event.capacity) {
        return NextResponse.json(
          { error: "Event RSVP capacity reached. No spots left!" },
          { status: 400 }
        );
      }

      await prisma.rsvp.create({
        data: {
          userId: sessionUser.id,
          eventId: params.id,
        },
      });

      // Record interaction for recommendation engine
      await prisma.interaction.create({
        data: {
          userId: sessionUser.id,
          eventId: params.id,
          type: "RSVP",
        },
      });

      // Notify host if it's someone else
      if (event.authorId !== sessionUser.id) {
        await prisma.notification.create({
          data: {
            userId: event.authorId,
            type: "RSVP",
            message: `${sessionUser.name} RSVP'd to your event: ${event.title}`,
            linkUrl: `/events/${event.id}`,
          },
        });
      }

      const updatedCount = await prisma.rsvp.count({ where: { eventId: params.id } });
      const spotsLeft = event.capacity ? Math.max(0, event.capacity - updatedCount) : null;

      return NextResponse.json({
        isRsvped: true,
        rsvpCount: updatedCount,
        spotsLeft,
        isFull: event.capacity ? updatedCount >= event.capacity : false,
        message: "RSVP successful! See you there 🎉",
      });
    }
  } catch (error: any) {
    console.error("RSVP Error:", error);
    return NextResponse.json({ error: "Failed to toggle RSVP" }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const attendees = await prisma.rsvp.findMany({
      where: { eventId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            faculty: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      attendees: attendees.map((a) => a.user),
      count: attendees.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch attendees" }, { status: 500 });
  }
}
