import { requireRole } from "@/lib/auth";
import AppShell from "@/components/AppShell";

const MENU = [
    { href: "/client", label: "Home" },
    { href: "/client/orders", label: "Orders" },
];

export default async function ClientLayout({ children }) {
    const user = await requireRole("client");
    return (
        <AppShell user={user} menu={MENU}>
            {children}
        </AppShell>
    );
}
