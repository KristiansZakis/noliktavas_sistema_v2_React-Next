"use client";

import { useRouter } from "next/navigation";
import { request } from "@/components/api-client";

export default function LogoutButton() {
    const router = useRouter();

    async function logout() {
        await request("/api/auth/logout", "POST");
        router.push("/login");
        router.refresh();
    }

    return (
        <button type="button" onClick={logout}>
            Log out
        </button>
    );
}
