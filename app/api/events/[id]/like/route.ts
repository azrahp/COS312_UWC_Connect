import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_eventId: {
          userId: sessionUser.id,
          eventId: params.id,
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      const likesCount = await prisma.like.count({ where: { eventId: params.id } });
      return NextResponse.json({ isLiked: false, likesCount });
    } else {
      await prisma.like.create({
        data: {
          userId: sessionUser.id,
          eventId: params.id,
        },
      });

      await prisma.interaction.create({
        data: {
          userId: sessionUser.id,
          eventId: params.id,
          type: "LIKE",
        },
      });

      const likesCount = await prisma.like.count({ where: { eventId: params.id } });
      return NextResponse.json({ isLiked: true, likesCount });
    }
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
