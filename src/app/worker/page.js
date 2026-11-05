import { requireRole } from "@/lib/auth";

export default async function Page() {
    await requireRole("worker");
    return (
        <>
            <h1>Worker panel</h1>
            <p>Your warehouse tasks will appear here.</p>
        </>
    );
}
