import Link from "next/link";
import LogoutButton from "./LogoutButton";
import styles from "./AppShell.module.css";

export default function AppShell({ user, menu, children }) {
    return (
        <div className={styles.shell}>
            <header className={styles.header}>
                <nav className={styles.nav}>
                    {menu.map((item) => (
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
