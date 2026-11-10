import { PERMISSIONS, ROLES, ROLE_LABELS, can } from "@/lib/constants";

export default function PermissionsTable() {
    return (
        <div className="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Permission</th>
                        {ROLES.map((r) => (
                            <th key={r}>{ROLE_LABELS[r]}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(PERMISSIONS).map(([key, label]) => (
                        <tr key={key}>
                            <td>{label}</td>
                            {ROLES.map((r) => (
                                <td key={r}>{can(r, key) ? "✓" : "—"}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
