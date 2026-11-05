import { requireRole } from "@/lib/auth";
import AppShell from "@/components/AppShell";

const MENU = [
    { href: "/admin", label: "Home" },
    { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({ children }) {
    const user = await requireRole("admin");
    return (
        <AppShell user={user} menu={MENU}>
            {children}
        </AppShell>
    );
}
