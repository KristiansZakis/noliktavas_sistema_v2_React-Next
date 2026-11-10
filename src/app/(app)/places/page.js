import { requirePermission } from "@/lib/auth";
import { listPlaces } from "@/lib/services";
import PlacesManager from "@/components/PlacesManager";

export default async function Page() {
    await requirePermission("places.manage");
    return (
        <>
            <h1>Locations</h1>
            <PlacesManager places={listPlaces()} />
        </>
    );
}
