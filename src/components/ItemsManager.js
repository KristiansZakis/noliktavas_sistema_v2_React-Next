"use client";

import { useState } from "react";
import { useApi } from "@/components/api-client";
import { ITEM_CONDITIONS, formatLocation } from "@/lib/constants";

function ItemFields({ item }) {
    return (
        <>
            <label>Name<input name="name" defaultValue={item?.name} maxLength={100} required /></label>
            <label>
                Code (10 letters/digits)
                <input name="code" defaultValue={item?.code} minLength={10} maxLength={10} pattern="[A-Za-z0-9]{10}" required />
            </label>
            <label>Count<input name="count" type="number" min={0} max={1000000} defaultValue={item?.count ?? 0} required /></label>
            <label>
                Condition
                <select name="item_condition" defaultValue={item?.item_condition ?? "new"}>
                    {ITEM_CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
            </label>
            <label>Description<input name="description" defaultValue={item?.description ?? ""} maxLength={500} /></label>
        </>
    );
}

export default function ItemsManager({ items, canEdit, canDelete }) {
    const { error, setError, call } = useApi();
    const [editing, setEditing] = useState(null);
    const [query, setQuery] = useState("");

    const shown = items.filter((i) => `${i.name} ${i.code}`.toLowerCase().includes(query.trim().toLowerCase()));
    const columns = 7 + (canEdit || canDelete ? 1 : 0);

    async function save(e, id) {
        e.preventDefault();
        const form = e.target;
        const r = await call(id ? `/api/items/${id}` : "/api/items", id ? "PATCH" : "POST", Object.fromEntries(new FormData(form)));
        if (!r.ok) return;
        setEditing(null);
        form.reset();
    }

    async function remove(item) {
        if (confirm(`Delete "${item.name}"? Its shelf placements are removed too.`))
            await call(`/api/items/${item.id}`, "DELETE");
    }

    return (
        <>
            {canEdit && (
                <div className="panel">
                    <h2>Add item</h2>
                    <form className="form" onSubmit={(e) => save(e, null)}>
                        <ItemFields />
                        <button className="primary" type="submit">Add</button>
                    </form>
                </div>
            )}

            {error && <p className="error">{error}</p>}

            <input type="search" placeholder="Search by name or code..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ minWidth: 260 }} />

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Code</th><th>Name</th><th>Count</th><th>Placed</th><th>Condition</th><th>Locations</th><th>Description</th>
                            {(canEdit || canDelete) && <th></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {shown.length === 0 && <tr><td colSpan={columns} className="muted">No items found.</td></tr>}
                        {shown.map((i) =>
                            editing === i.id ? (
                                <tr key={i.id}>
                                    <td colSpan={columns}>
                                        <form className="form" onSubmit={(e) => save(e, i.id)}>
                                            <ItemFields item={i} />
                                            <button className="primary" type="submit">Save</button>
                                            <button type="button" onClick={() => setEditing(null)}>Cancel</button>
                                        </form>
                                    </td>
                                </tr>
                            ) : (
                                <tr key={i.id}>
                                    <td>{i.code}</td>
                                    <td>{i.name}</td>
                                    <td>{i.count}</td>
                                    <td className={i.placed !== i.count ? "warn" : ""}>{i.placed}</td>
                                    <td><span className={`badge ${i.item_condition}`}>{i.item_condition}</span></td>
                                    <td>
                                        {i.placements.length
                                            ? i.placements.map((p) => `${formatLocation(p)} ×${p.quantity}`).join(", ")
                                            : <span className="muted">not placed</span>}
                                    </td>
                                    <td>{i.description}</td>
                                    {(canEdit || canDelete) && (
                                        <td>
                                            <div className="actions">
                                                {canEdit && <button type="button" onClick={() => { setEditing(i.id); setError(""); }}>Edit</button>}
                                                {canDelete && <button type="button" className="danger" onClick={() => remove(i)}>Delete</button>}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ),
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
