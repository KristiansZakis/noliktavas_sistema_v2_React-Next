"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

export default function Register() {
    const [message, setMessage] = useState("");
    const router = useRouter();

    async function handleSubmit(e) {
        e.preventDefault();
        const form = new FormData(e.target);

        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: form.get("username"),
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
                    <h1>Registration</h1>
                    <input
                        className={styles.emailField}
                        name="username"
                        type="text"
                        placeholder="Username"
                        minLength={3}
                        maxLength={20}
                        required
                    />
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
                        minLength={8}
                        required
                    />
                    <button type="submit" className={styles.registerBtn}>
                        Register
                    </button>
                    <p className={styles.footerText}>{message}</p>
                    <p className={styles.switchText}>
                        Already have an account?{" "}
                        <Link className={styles.switchLink} href="/login">
                            Log in
                        </Link>
                    </p>
                </form>
            </main>
        </div>
    );
}
