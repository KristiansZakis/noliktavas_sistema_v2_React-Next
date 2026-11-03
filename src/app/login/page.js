"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Link from "next/link";

export default function Login() {
    const [message, setMessage] = useState("");
    const router = useRouter();

    async function handleSubmit(e) {
        e.preventDefault();
        const form = new FormData(e.target);

        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: form.get("email"),
                password: form.get("password"),
            }),
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            router.push("/dashboard");
        } else {
            setMessage(data.error || "Server error");
        }
    }

    return (
        <div className={styles.page}>
            <main className={styles.main}>
                <form className={styles.intro} onSubmit={handleSubmit}>
                    <h1>Login</h1>
                    <input
                        className={styles.emailField}
                        name="email"
                        type="email"
                        placeholder="Email"
                        required
                    />
                    <input
                        className={styles.passwordField}
                        name="password"
                        type="password"
                        placeholder="Password"
                        required
                    />
                    <button type="submit" className={styles.loginBtn}>
                        Log in
                    </button>
                    <p className={styles.footerText}>{message}</p>
                    <p className={styles.switchText}>
                        No account yet?{" "}
                        <Link className={styles.switchLink} href="/register">
                            Register
                        </Link>
                    </p>
                </form>
            </main>
        </div>
    );
}
