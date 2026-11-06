import { requireRole } from "@/lib/auth";

export default async function Page() {
    await requireRole("client");
    return (
        <>
            <h1>Orders</h1>
            <p>Your orders will appear here.</p>
        </>
    );
}
