import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { homeFor } from "@/lib/constants";

export default async function Home() {
    const user = await getCurrentUser();
    redirect(user ? homeFor(user.role) : "/login");
}
