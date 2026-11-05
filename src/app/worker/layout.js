import { requireRole } from "@/lib/auth";
import AppShell from "@/components/AppShell";

const MENU = [
    { href: "/worker", label: "Home" },
    { href: "/worker/stock", label: "Stock" },
];

export default async function WorkerLayout({ children }) {
    const user = await requireRole("worker");
    return (
        <AppShell user={user} menu={MENU}>
            {children}
        </AppShell>
    );
}
