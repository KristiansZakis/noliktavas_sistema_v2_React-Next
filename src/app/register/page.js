"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function Register() {
    const [message, setMessage] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        const form = new FormData(e.target);

        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: form.get("email"),
                password: form.get("password"),
            }),
        });

        const data = await res.json();
        setMessage(res.ok ? "Registered! You can log in now." : data.error);
    }

    return (
        <div className={styles.page}>
            <main className={styles.main}>
                <form className={styles.intro} onSubmit={handleSubmit}>
                    <h1>Registration</h1>
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
                    <button type="submit">Register</button>
                    <p className={styles.footerText}>{message}</p>
                </form>
            </main>
        </div>
    );
}
