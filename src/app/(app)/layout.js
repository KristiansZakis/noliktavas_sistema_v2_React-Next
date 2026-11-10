import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { menuFor, ROLE_LABELS } from "@/lib/constants";
import LogoutButton from "@/components/LogoutButton";

export default async function AppLayout({ children }) {
    const user = await requirePermission();
    return (
        <>
            <header className="header">
                <nav className="nav">
                    {menuFor(user.role).map((m) => (
                        <Link key={m.href} href={m.href}>
                            {m.label}
                        </Link>
                    ))}
                </nav>
                <div className="user">
                    <span>
                        {user.username} ({ROLE_LABELS[user.role]})
                    </span>
                    <LogoutButton />
                </div>
            </header>
            <main className="content">{children}</main>
        </>
    );
}
