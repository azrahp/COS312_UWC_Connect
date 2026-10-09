import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: sessionUser.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: sessionUser.id, isRead: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { notificationId } = body;

    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId, userId: sessionUser.id },
        data: { isRead: true },
      });
    } else {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId: sessionUser.id, isRead: false },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ message: "Notifications marked as read" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
  }
}
