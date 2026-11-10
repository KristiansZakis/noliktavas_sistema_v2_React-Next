"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export async function request(url, method, body) {
    try {
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        return {
            ok: res.ok,
            data,
            error: res.ok ? "" : data.error || "Server error",
        };
    } catch {
        return { ok: false, data: {}, error: "Network error" };
    }
}

export function useApi() {
    const router = useRouter();
    const [error, setError] = useState("");

    async function call(url, method, body) {
        const r = await request(url, method, body);
        setError(r.error);
        if (r.ok) router.refresh();
        return r;
    }
    return { error, setError, call, router };
}
