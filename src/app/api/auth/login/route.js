import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(request) {
    const body = await request.json().catch(() => null);
    const email = body?.email;
    const password = body?.password;

    if (typeof email !== "string" || typeof password !== "string") {
        return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const user = db
        .prepare("SELECT id, password_hash FROM users WHERE email = ?")
        .get(email.trim().toLowerCase());

    const valid = user && (await bcrypt.compare(password, user.password_hash));

    if (!valid) {
        return Response.json(
            { error: "Wrong email or password" },
            { status: 401 },
        );
    }

    await createSession(user.id);
    return Response.json({ ok: true });
}
