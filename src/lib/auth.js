import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import db from "@/lib/db";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
const COOKIE_NAME = "session";

export async function createSession(userId) {
    const token = await new SignJWT({ userId })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secret);

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
    });
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch {
        return null;
    }
}

export async function destroySession() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
    const session = await getSession();
    if (!session) return null;
    return (
        db
            .prepare("SELECT id, username, email, role FROM users WHERE id = ?")
            .get(session.userId) ?? null
    );
}

export async function requireRole(...roles) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (!roles.includes(user.role)) redirect("/dashboard");
    return user;
}
