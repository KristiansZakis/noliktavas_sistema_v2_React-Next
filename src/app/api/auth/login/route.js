import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { createSession } from "@/lib/auth";

const failures = new Map();
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const recent = (key) =>
    (failures.get(key) ?? []).filter((t) => Date.now() - t < WINDOW_MS);

const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

export async function POST(request) {
    const body = await request.json().catch(() => null);
    if (typeof body?.email !== "string" || typeof body?.password !== "string")
        return Response.json({ error: "Invalid request" }, { status: 400 });

    const email = body.email.trim().toLowerCase();
    if (recent(email).length >= MAX_FAILURES)
        return Response.json(
            { error: "Too many failed attempts. Try again in 15 minutes." },
            { status: 429 },
        );

    const user = db
        .prepare("SELECT id, password_hash FROM users WHERE email = ?")
        .get(email);
    const valid = await bcrypt.compare(
        body.password,
        user ? user.password_hash : DUMMY_HASH,
    );

    if (!user || !valid) {
        failures.set(email, [...recent(email), Date.now()]);
        return Response.json(
            { error: "Wrong email or password" },
            { status: 401 },
        );
    }

    failures.delete(email);
    await createSession(user.id);
    return Response.json({ ok: true });
}
