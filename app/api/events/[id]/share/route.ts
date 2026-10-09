import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const sessionUser = await getSessionUser();
    const body = await req.json().catch(() => ({}));
    const platform = body.platform || "clipboard";

    if (sessionUser) {
      await prisma.share.create({
        data: {
          userId: sessionUser.id,
          eventId: params.id,
          platform,
        },
      });

      await prisma.interaction.create({
        data: {
          userId: sessionUser.id,
          eventId: params.id,
          type: "SHARE",
        },
      });
    }

    const shareCount = await prisma.share.count({ where: { eventId: params.id } });
    return NextResponse.json({ shareCount, message: "Share recorded" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to record share" }, { status: 500 });
  }
}
