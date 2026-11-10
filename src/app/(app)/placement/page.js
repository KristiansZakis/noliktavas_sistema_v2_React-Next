import { requirePermission } from "@/lib/auth";
import { listItems } from "@/lib/services";
import PlacementManager from "@/components/PlacementManager";

export default async function Page() {
    await requirePermission("placement.manage");
    return (
        <>
            <h1>Item placement</h1>
            <PlacementManager items={listItems()} />
        </>
    );
}
