"use client";

import { useState } from "react";
import { useApi } from "@/components/api-client";
import { ROLES, ROLE_LABELS } from "@/lib/constants";

function UserFields({ user, passwordRequired }) {
    return (
        <>
            <label>
                Username
                <input
                    name="username"
                    defaultValue={user?.username}
                    minLength={3}
                    maxLength={20}
                    pattern="[A-Za-z0-9_]{3,20}"
                    required
                />
            </label>
            <label>
                Email
                <input
                    name="email"
                    type="email"
                    defaultValue={user?.email}
                    maxLength={120}
                    required
                />
            </label>
            <label>
                {passwordRequired ? "Password" : "New password (optional)"}
                <input
                    name="password"
                    type="password"
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    required={passwordRequired}
                />
            </label>
            <label>
                Role
                <select name="role" defaultValue={user?.role ?? "shelf-worker"}>
                    {ROLES.map((r) => (
                        <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                        </option>
                    ))}
                </select>
            </label>
        </>
    );
}

export default function UsersManager({ users, currentUserId }) {
    const { error, setError, call } = useApi();
    const [editing, setEditing] = useState(null);

    async function save(e, id) {
        e.preventDefault();
        const form = e.target;
        const body = Object.fromEntries(new FormData(form));
        const r = await call(
            id ? `/api/users/${id}` : "/api/users",
            id ? "PATCH" : "POST",
            body,
        );
        if (!r.ok) return;
        setEditing(null);
        form.reset();
    }

    async function remove(u) {
        if (confirm(`Delete user "${u.username}"?`))
            await call(`/api/users/${u.id}`, "DELETE");
    }

    return (
        <>
            <div className="panel">
                <h2>Create user</h2>
                <form className="form" onSubmit={(e) => save(e, null)}>
                    <UserFields passwordRequired />
                    <button className="primary" type="submit">
                        Create
                    </button>
                </form>
            </div>

            {error && <p className="error">{error}</p>}

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Created</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) =>
                            editing === u.id ? (
                                <tr key={u.id}>
                                    <td colSpan={5}>
                                        <form
                                            className="form"
                                            onSubmit={(e) => save(e, u.id)}>
                                            <UserFields user={u} />
                                            <button
                                                className="primary"
                                                type="submit">
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setEditing(null)
                                                }>
                                                Cancel
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            ) : (
                                <tr key={u.id}>
                                    <td>
                                        {u.username}
                                        {u.id === currentUserId && (
                                            <span className="muted">
                                                {" "}
                                                (you)
                                            </span>
                                        )}
                                    </td>
                                    <td>{u.email}</td>
                                    <td>{ROLE_LABELS[u.role]}</td>
                                    <td>{u.created_at}</td>
                                    <td>
                                        <div className="actions">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditing(u.id);
                                                    setError("");
                                                }}>
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="danger"
                                                disabled={
                                                    u.id === currentUserId
                                                }
                                                onClick={() => remove(u)}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ),
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
