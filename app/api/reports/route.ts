import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized. Please log in to report content." }, { status: 401 });
    }

    const { eventId, reason } = await req.json();
    if (!eventId || !reason || !reason.trim()) {
      return NextResponse.json({ error: "eventId and reason are required." }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const report = await prisma.report.create({
      data: {
        eventId,
        reporterId: sessionUser.id,
        reason: reason.trim(),
        status: "PENDING",
      },
    });

    return NextResponse.json({
      report,
      message: "Thank you. Your report has been submitted to UWC campus moderators.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const reports = await prisma.report.findMany({
      include: {
        event: {
          include: {
            author: {
              select: { id: true, name: true, email: true, status: true, avatarUrl: true },
            },
          },
        },
        reporter: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        resolvedBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reports });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch reports queue" }, { status: 500 });
  }
}
