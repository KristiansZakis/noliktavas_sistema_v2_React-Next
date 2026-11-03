import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Dashboard() {
    const session = await getSession();
    if (!session) redirect("/login");

    return <h1>Welcome, user #{session.userId}</h1>;
}
