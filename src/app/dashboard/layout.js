import Link from "next/link";
import { requireRole } from "@/lib/auth";
import LogoutButton from "./LogoutButton";
import styles from "./layout.module.css";

const MENU = {
    admin: [
        { href: "/dashboard", label: "Home" },
        { href: "/dashboard/users", label: "Users" },
    ],
    worker: [{ href: "/dashboard", label: "Home" }],
    client: [{ href: "/dashboard", label: "Home" }],
};

export default async function DashboardLayout({ children }) {
    const user = await requireRole("admin", "worker", "client");

    return (
        <div className={styles.shell}>
            <header className={styles.header}>
                <nav className={styles.nav}>
                    {MENU[user.role].map((item) => (
                        <Link key={item.href} href={item.href}>
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className={styles.user}>
                    <span>
                        {user.username} ({user.role})
                    </span>
                    <LogoutButton />
                </div>
            </header>
            <main className={styles.content}>{children}</main>
        </div>
    );
}
