import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { interests } = await req.json();
    if (!Array.isArray(interests)) {
      return NextResponse.json({ error: "Interests must be an array of strings" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        interests: JSON.stringify(interests),
      },
    });

    return NextResponse.json({
      message: "Interests updated successfully",
      interests: JSON.parse(updatedUser.interests),
    });
  } catch (error: any) {
    console.error("Update interests error:", error);
    return NextResponse.json({ error: "Failed to update interests" }, { status: 500 });
  }
}
