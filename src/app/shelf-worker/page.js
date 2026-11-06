import { requireRole } from "@/lib/auth";

export default async function Page() {
    await requireRole("client");
    return (
        <>
            <h1>Client area</h1>
            <p>Your orders will appear here.</p>
        </>
    );
}
