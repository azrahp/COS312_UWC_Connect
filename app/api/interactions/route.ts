import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ message: "Ignored for unauthenticated user" }, { status: 200 });
    }

    const { eventId, type } = await req.json();
    if (!eventId || !type) {
      return NextResponse.json({ error: "eventId and type are required" }, { status: 400 });
    }

    // Rate-limit view logging for same event/user within 5 minutes to prevent spam
    if (type === "VIEW") {
      const recentView = await prisma.interaction.findFirst({
        where: {
          userId: sessionUser.id,
          eventId,
          type: "VIEW",
          createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
        },
      });

      if (recentView) {
        return NextResponse.json({ message: "View already logged recently" });
      }
    }

    const interaction = await prisma.interaction.create({
      data: {
        userId: sessionUser.id,
        eventId,
        type: type.toUpperCase(),
      },
    });

    return NextResponse.json({ interaction, message: "Interaction logged" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to record interaction" }, { status: 500 });
  }
}
