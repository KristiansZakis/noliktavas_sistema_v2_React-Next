import { requirePermission } from "@/lib/auth";
import { listUsers } from "@/lib/services";
import UsersManager from "@/components/UsersManager";
import PermissionsTable from "@/components/PermissionsTable";

export default async function Page() {
    const me = await requirePermission("users.manage");
    return (
        <>
            <h1>Users</h1>
            <UsersManager users={listUsers()} currentUserId={me.id} />
            <h2>Roles and permissions</h2>
            <PermissionsTable />
        </>
    );
}
