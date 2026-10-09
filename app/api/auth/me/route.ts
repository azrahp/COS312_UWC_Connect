import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        bio: true,
        studentStaffNumber: true,
        faculty: true,
        yearOfStudy: true,
        interests: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            events: true,
          },
        },
      },
    });

    if (!fullUser) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    let parsedInterests: string[] = [];
    try {
      parsedInterests = JSON.parse(fullUser.interests || "[]");
    } catch {
      parsedInterests = [];
    }

    return NextResponse.json({
      user: {
        ...fullUser,
        interests: parsedInterests,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
