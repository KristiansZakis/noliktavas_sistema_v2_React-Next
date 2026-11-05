import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

const HOME = {
    admin: "/admin",
    worker: "/worker",
    client: "/client",
};

export default async function Dashboard() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    redirect(HOME[user.role] ?? "/login");
}
