import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { can } from "@/lib/constants";

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error(
        "SESSION_SECRET must be set to a random value of 32+ characters (see .env.example)",
    );
}
const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
const COOKIE = "session";
const WEEK = 60 * 60 * 24 * 7;

export async function createSession(userId) {
    const token = await new SignJWT({ userId })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(secret);
    (await cookies()).set(COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: WEEK,
    });
}

export async function destroySession() {
    (await cookies()).delete(COOKIE);
}

// The role is always read from the database, so role changes and deleted
// accounts take effect immediately instead of when the cookie expires.
export async function getCurrentUser() {
    const token = (await cookies()).get(COOKIE)?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, secret);
        return (
            db
                .prepare("SELECT id, username, email, role FROM users WHERE id = ?")
                .get(payload.userId) ?? null
        );
    } catch {
        return null;
    }
}

/** For pages: returns the user, or redirects if not logged in / not allowed. */
export async function requirePermission(permission) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (permission && !can(user.role, permission)) redirect("/");
    return user;
}
