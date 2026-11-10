"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RoleSelect({ userId, role }) {
    const [value, setValue] = useState(role);
    const [error, setError] = useState("");
    const router = useRouter();

    async function handleChange(e) {
        const newRole = e.target.value;
        const res = await fetch(`/api/admin/users/${userId}/role`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: newRole }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            setValue(newRole);
            setError("");
            router.refresh();
        } else {
            setError(data.error || "Server error");
        }
    }

    return (
        <>
            <select value={value} onChange={handleChange}>
                <option value="admin">admin</option>
                <option value="worker">worker</option>
                <option value="shelf-worker">shelf-worker</option>
            </select>
            {error && <span> {error}</span>}
        </>
    );
}
