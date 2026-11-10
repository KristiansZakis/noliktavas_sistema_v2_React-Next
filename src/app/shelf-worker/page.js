import { requireRole } from "@/lib/auth";

export default async function Page() {
    await requireRole("shelf-worker");
    return (
        <>
            <h1>Shells</h1>
            <p>Shelf adress</p>
            <div id="sidebar">
                <button>New item</button>
                <button>Storage</button>
                <button>Shelfs</button>
            </div>
        </>
    );
}
