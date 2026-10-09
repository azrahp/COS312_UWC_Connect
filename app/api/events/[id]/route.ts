import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            bio: true,
            role: true,
            faculty: true,
            status: true,
          },
        },
        _count: {
          select: { likes: true, rsvps: true, comments: true, shares: true, saves: true },
        },
        rsvps: {
          take: 5,
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        likes: sessionUser ? { where: { userId: sessionUser.id } } : false,
        saves: sessionUser ? { where: { userId: sessionUser.id } } : false,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isRsvped = sessionUser
      ? (await prisma.rsvp.count({ where: { eventId: event.id, userId: sessionUser.id } })) > 0
      : false;

    return NextResponse.json({
      event: {
        ...event,
        isRsvped,
        isLiked: Array.isArray(event.likes) && event.likes.length > 0,
        isSaved: Array.isArray(event.saves) && event.saves.length > 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.event.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (existing.authorId !== sessionUser.id && sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden. Only author or admin can edit." }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, category, location, startsAt, imageUrl, capacity, externalUrl, status } = body;

    const updated = await prisma.event.update({
      where: { id: params.id },
      data: {
        title: title ? title.trim() : existing.title,
        description: description ? description.trim() : existing.description,
        category: category ? category.toLowerCase().trim() : existing.category,
        location: location ? location.trim() : existing.location,
        startsAt: startsAt ? new Date(startsAt) : existing.startsAt,
        imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
        capacity: capacity !== undefined ? (capacity ? parseInt(capacity, 10) : null) : existing.capacity,
        externalUrl: externalUrl !== undefined ? externalUrl : existing.externalUrl,
        status: status || existing.status,
      },
    });

    return NextResponse.json({ event: updated, message: "Event updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.event.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (existing.authorId !== sessionUser.id && sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden. Only author or admin can delete." }, { status: 403 });
    }

    await prisma.event.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
