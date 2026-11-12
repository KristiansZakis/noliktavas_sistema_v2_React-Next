import { requirePermission } from "@/lib/auth";
import { can } from "@/lib/constants";
import { listItems } from "@/lib/services";
import ItemsManager from "@/components/ItemsManager";

export default async function Page() {
    const user = await requirePermission("items.view");
    return (
        <>
            <h1>Items</h1>
            <ItemsManager
                items={listItems()}
                canEdit={can(user.role, "items.edit")}
                canDelete={can(user.role, "items.delete")}
            />
        </>
    );
}
