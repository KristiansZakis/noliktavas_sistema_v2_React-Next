import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(request) {
    const body = await request.json().catch(() => null);
    const username = body?.username;
    const email = body?.email;
    const password = body?.password;

    if (
        typeof username !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string"
    ) {
        return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const cleanUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
        return Response.json(
            {
                error: "Username must be 3-20 characters: letters, numbers, underscore",
            },
            { status: 400 },
        );
    }
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

    let userId;
    try {
        const result = db
            .prepare(
                "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            )
            .run(cleanUsername, normalizedEmail, passwordHash);
        userId = Number(result.lastInsertRowid);
    } catch (err) {
        if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
            const field = err.message.includes("users.username")
                ? "Username"
                : "Email";
            return Response.json(
                { error: `${field} already taken` },
                { status: 409 },
            );
        }
        console.error(err);
        return Response.json({ error: "Server error" }, { status: 500 });
    }

    await createSession(userId);
    return Response.json({ ok: true }, { status: 201 });
}
