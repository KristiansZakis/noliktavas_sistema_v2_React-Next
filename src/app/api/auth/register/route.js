import bcrypt from "bcryptjs";
import db from "@/lib/db";

export async function POST(request) {
    const body = await request.json().catch(() => null);
    const email = body?.email;
    const password = body?.password;
    if (typeof email !== "string" || typeof password !== "string") {
        return Response.json({ error: "Invalid request" }, { statuss: 400 });
    }

    const normalizedEmail = email.trim().toLocaleLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return Response.json({ error: "Invalid email" }, { status: 400 });
    }

    if (password.length < 8) {
        return Response.json(
            { error: "Password must be at least 8 characters" },
            { status: 400 },
        );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    try {
        db.prepare(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
        ).run(normalizedEmail, passwordHash);
    } catch (err) {
        if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
            return Response.json(
                { error: "Email already registered" },
                { status: 409 },
            );
        }
        console.error(err);
        return Response.json({ error: "Server error" }, { status: 500 });
    }

    return Response.json({ ok: true }, { status: 201 });
}
