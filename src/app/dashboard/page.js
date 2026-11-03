import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export default async function Dashboard() {
    const session = await getSession();
    if (!session) redirect("/login");

    const user = db
        .prepare("SELECT username FROM users WHERE id = ?")
        .get(session.userId);

    return <h1>Welcome, {user.username}</h1>;
}
