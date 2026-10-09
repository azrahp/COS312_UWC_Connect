import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const JWT_SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "uwc-connect-secret-key-2026-very-secure"
);

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "STAFF" | "ADMIN";
  avatarUrl?: string | null;
  status: "ACTIVE" | "SUSPENDED";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function deriveRoleFromEmail(email: string): "STUDENT" | "STAFF" {
  const lower = email.toLowerCase().trim();
  if (lower.endsWith("@myuwc.ac.za")) {
    return "STUDENT";
  }
  if (lower.endsWith("@uwc.ac.za")) {
    return "STAFF";
  }
  throw new Error("Invalid domain. Email must end with @myuwc.ac.za or @uwc.ac.za");
}

export async function createSessionToken(payload: { userId: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET_KEY);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY);
    return payload as { userId: string };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("uwc_session")?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        status: true,
      },
    });

    if (!user || user.status === "SUSPENDED") {
      return null;
    }

    return user as SessionUser;
  } catch (error) {
    return null;
  }
}
