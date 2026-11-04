import Link from "next/link";
import { requireRole } from "@/lib/auth";

export default async function Dashboard() {
    const user = await requireRole("admin", "worker", "client");

    return (
        <main>
            <h1>Welcome, {user.username}</h1>
            <p>Role: {user.role}</p>
            {user.role === "admin" && (
                <Link href="/dashboard/users">Manage users</Link>
            )}
        </main>
    );
}
