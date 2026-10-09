import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingSave = await prisma.save.findUnique({
      where: {
        userId_eventId: {
          userId: sessionUser.id,
          eventId: params.id,
        },
      },
    });

    if (existingSave) {
      await prisma.save.delete({ where: { id: existingSave.id } });
      const savesCount = await prisma.save.count({ where: { eventId: params.id } });
      return NextResponse.json({ isSaved: false, savesCount, message: "Removed from saved" });
    } else {
      await prisma.save.create({
        data: {
          userId: sessionUser.id,
          eventId: params.id,
        },
      });

      await prisma.interaction.create({
        data: {
          userId: sessionUser.id,
          eventId: params.id,
          type: "SAVE",
        },
      });

      const savesCount = await prisma.save.count({ where: { eventId: params.id } });
      return NextResponse.json({ isSaved: true, savesCount, message: "Saved to your bookmarks!" });
    }
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to toggle save" }, { status: 500 });
  }
}
