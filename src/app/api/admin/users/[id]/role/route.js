import db from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const ROLES = ["admin", "worker", "client"];

export async function PATCH(request, { params }) {
    const me = await getCurrentUser();
    if (!me) return Response.json({ error: "Not logged in" }, { status: 401 });
    if (me.role !== "admin")
        return Response.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const userId = Number(id);
    const body = await request.json().catch(() => null);
    const role = body?.role;

    if (!Number.isInteger(userId) || !ROLES.includes(role)) {
        return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const target = db
        .prepare("SELECT id, role FROM users WHERE id = ?")
        .get(userId);
    if (!target)
        return Response.json({ error: "User not found" }, { status: 404 });

    if (target.role === "admin" && role !== "admin") {
        const { count } = db
            .prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'")
            .get();
        if (count <= 1) {
            return Response.json(
                { error: "There must be at least one admin" },
                { status: 400 },
            );
        }
    }

    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, userId);
    return Response.json({ ok: true });
}
