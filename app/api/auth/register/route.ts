import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, deriveRoleFromEmail, createSessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, faculty, studentStaffNumber, yearOfStudy, interests, bio } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required fields." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    let role: "STUDENT" | "STAFF";
    try {
      role = deriveRoleFromEmail(cleanEmail);
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || "Registration is restricted to @myuwc.ac.za (Students) and @uwc.ac.za (Staff) email domains." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const interestsJson = JSON.stringify(Array.isArray(interests) ? interests : []);

    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        role,
        name: name.trim(),
        faculty: faculty || null,
        studentStaffNumber: studentStaffNumber || null,
        yearOfStudy: yearOfStudy ? parseInt(yearOfStudy, 10) : null,
        bio: bio || null,
        interests: interestsJson,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      },
    });

    const token = await createSessionToken({ userId: newUser.id });

    const response = NextResponse.json({
      message: "Registration successful",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        avatarUrl: newUser.avatarUrl,
        interests: JSON.parse(newUser.interests),
      },
    });

    response.cookies.set("uwc_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}
