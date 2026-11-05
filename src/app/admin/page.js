import Link from "next/link";
import { requireRole } from "@/lib/auth";
import db from "@/lib/db";

export default async function AdminHome() {
    await requireRole("admin");

    const { total } = db.prepare("SELECT COUNT(*) AS total FROM users").get();
    const roles = db
        .prepare("SELECT role, COUNT(*) AS count FROM users GROUP BY role")
        .all();

    return (
        <>
            <h1>Admin panel</h1>
            <p>Total users: {total}</p>
            <ul>
                {roles.map((r) => (
                    <li key={r.role}>
                        {r.role}: {r.count}
                    </li>
                ))}
            </ul>
            <Link href="/admin/users">Manage users</Link>
        </>
    );
}
