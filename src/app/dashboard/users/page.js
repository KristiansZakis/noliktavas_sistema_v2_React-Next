import { requireRole } from "@/lib/auth";
import db from "@/lib/db";
import RoleSelect from "./RoleSelect";

export default async function UsersPage() {
    await requireRole("admin");

    const users = db
        .prepare("SELECT id, username, email, role FROM users ORDER BY id")
        .all();

    return (
        <main>
            <h1>Users</h1>
            <table>
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u.id}>
                            <td>{u.username}</td>
                            <td>{u.email}</td>
                            <td>
                                <RoleSelect userId={u.id} role={u.role} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    );
}
