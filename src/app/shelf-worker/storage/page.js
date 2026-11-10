import { requireRole } from "@/lib/auth";

export default async function Page() {
    await requireRole("shelf-worker");
    return (
        <>
            <h1>Storage</h1>
            <p>Items will be placed here.</p>
        </>
    );
}
