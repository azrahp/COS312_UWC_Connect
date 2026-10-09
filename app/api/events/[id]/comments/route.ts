import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const comments = await prisma.comment.findMany({
      where: { eventId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ comments });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized. Please log in to comment." }, { status: 401 });
    }

    const { content } = await req.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Comment content cannot be empty." }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        userId: sessionUser.id,
        eventId: params.id,
        content: content.trim(),
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, role: true },
        },
      },
    });

    await prisma.interaction.create({
      data: {
        userId: sessionUser.id,
        eventId: params.id,
        type: "COMMENT",
      },
    });

    // Notify post owner if commenter is not author
    if (event.authorId !== sessionUser.id) {
      await prisma.notification.create({
        data: {
          userId: event.authorId,
          type: "COMMENT",
          message: `${sessionUser.name} commented on your event: "${content.trim().slice(0, 40)}..."`,
          linkUrl: `/events/${event.id}`,
        },
      });
    }

    return NextResponse.json({ comment, message: "Comment added!" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ error: "commentId is required" }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { event: { select: { authorId: true } } },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const isCommentOwner = comment.userId === sessionUser.id;
    const isEventOwner = comment.event.authorId === sessionUser.id;
    const isAdmin = sessionUser.role === "ADMIN";

    if (!isCommentOwner && !isEventOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden. You cannot delete this comment." }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return NextResponse.json({ message: "Comment deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
