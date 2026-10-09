import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const { reportId, action } = await req.json(); // action: 'REMOVE_POST' | 'DISMISS_REPORT' | 'SUSPEND_ACCOUNT'

    if (!reportId || !action) {
      return NextResponse.json({ error: "reportId and action are required." }, { status: 400 });
    }

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        event: { include: { author: true } },
        reporter: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (action === "REMOVE_POST") {
      // Mark event status as REMOVED
      await prisma.event.update({
        where: { id: report.eventId },
        data: { status: "REMOVED" },
      });

      await prisma.report.update({
        where: { id: reportId },
        data: { status: "RESOLVED", resolvedById: sessionUser.id },
      });

      // Notify reporter & event author
      await prisma.notification.create({
        data: {
          userId: report.reporterId,
          type: "MODERATION",
          message: `Your report regarding "${report.event.title}" was reviewed and the event has been removed.`,
        },
      });

      await prisma.notification.create({
        data: {
          userId: report.event.authorId,
          type: "MODERATION",
          message: `Your post "${report.event.title}" was removed by campus moderation for violating UWC community guidelines.`,
        },
      });

      return NextResponse.json({ message: "Post removed and report marked resolved." });
    } else if (action === "DISMISS_REPORT") {
      await prisma.report.update({
        where: { id: reportId },
        data: { status: "DISMISS", resolvedById: sessionUser.id },
      });

      await prisma.notification.create({
        data: {
          userId: report.reporterId,
          type: "MODERATION",
          message: `Your report regarding "${report.event.title}" was reviewed. No policy violation was found.`,
        },
      });

      return NextResponse.json({ message: "Report dismissed." });
    } else if (action === "SUSPEND_ACCOUNT") {
      // Suspend user account and remove all their events
      await prisma.user.update({
        where: { id: report.event.authorId },
        data: { status: "SUSPENDED" },
      });

      await prisma.event.updateMany({
        where: { authorId: report.event.authorId },
        data: { status: "REMOVED" },
      });

      await prisma.report.update({
        where: { id: reportId },
        data: { status: "RESOLVED", resolvedById: sessionUser.id },
      });

      await prisma.notification.create({
        data: {
          userId: report.reporterId,
          type: "MODERATION",
          message: `Account of user ${report.event.author.name} has been suspended following your report.`,
        },
      });

      return NextResponse.json({ message: `User ${report.event.author.name} suspended and post removed.` });
    } else {
      return NextResponse.json({ error: "Invalid moderation action." }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Admin moderation error:", error);
    return NextResponse.json({ error: "Failed to perform moderation action" }, { status: 500 });
  }
}
