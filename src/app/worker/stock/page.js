import { requireRole } from "@/lib/auth";

export default async function Page() {
    await requireRole("worker");
    return (
        <>
            <h1>Stock</h1>
            <p>Stock overview will appear here.</p>
        </>
    );
}
