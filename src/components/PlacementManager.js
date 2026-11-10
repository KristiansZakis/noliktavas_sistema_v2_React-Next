"use client";

import { useState } from "react";
import { useApi } from "@/components/api-client";
import { formatLocation } from "@/lib/constants";

const EMPTY = {
    itemId: "",
    placeId: null,
    row: "",
    column: "",
    shelf: "",
    quantity: 1,
};

export default function PlacementManager({ items }) {
    const { error, setError, call } = useApi();
    const [form, setForm] = useState(EMPTY);
    const [query, setQuery] = useState("");

    const set = (patch) => setForm((f) => ({ ...f, ...patch }));
    const editing = form.placeId !== null;
    const rows = items
        .flatMap((item) => item.placements.map((p) => ({ item, p })))
        .filter(({ item }) =>
            `${item.name} ${item.code}`
                .toLowerCase()
                .includes(query.trim().toLowerCase()),
        );

    async function submit(e) {
        e.preventDefault();
        const r = await call("/api/placement", "POST", form);
        if (r.ok) setForm(EMPTY);
    }

    function edit(item, p) {
        setError("");
        setForm({
            itemId: item.id,
            placeId: p.place_id,
            row: p.storage_row_number,
            column: p.shelf_column_number,
            shelf: p.shelf_number,
            quantity: p.quantity,
        });
    }

    async function remove(item, p) {
        if (confirm(`Remove "${item.name}" from ${formatLocation(p)}?`))
            await call("/api/placement", "DELETE", {
                itemId: item.id,
                placeId: p.place_id,
            });
    }

    const num = (name, label, min, max) => (
        <label>
            {label}
            <input
                type="number"
                min={min}
                max={max}
                value={form[name]}
                onChange={(e) => set({ [name]: e.target.value })}
                required
            />
        </label>
    );

    return (
        <>
            <p className="muted">
                R = storage row, C = shelf column, S = shelf level.
            </p>

            <div className="panel">
                <h2>
                    {editing
                        ? "Update or move placement"
                        : "Register placement"}
                </h2>
                <form className="form" onSubmit={submit}>
                    <label>
                        Item
                        <select
                            value={form.itemId}
                            onChange={(e) => set({ itemId: e.target.value })}
                            disabled={editing}
                            required>
                            <option value="" disabled>
                                Select item...
                            </option>
                            {items.map((i) => (
                                <option key={i.id} value={i.id}>
                                    {i.name} ({i.code}) -{" "}
                                    {Math.max(i.count - i.placed, 0)} unplaced
                                    of {i.count}
                                </option>
                            ))}
                        </select>
                    </label>
                    {num("row", "Row", 1, 999)}
                    {num("column", "Column", 1, 999)}
                    {num("shelf", "Shelf", 1, 99)}
                    {num("quantity", "Quantity", 1, 1000000)}
                    <button className="primary" type="submit">
                        {editing ? "Save" : "Register"}
                    </button>
                    {editing && (
                        <button type="button" onClick={() => setForm(EMPTY)}>
                            Cancel
                        </button>
                    )}
                </form>
                {error && <p className="error">{error}</p>}
            </div>

            <h2>Current placements</h2>
            <input
                type="search"
                placeholder="Search by name or code..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ minWidth: 260 }}
            />
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Location</th>
                            <th>Code</th>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Condition</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={6} className="muted">
                                    No placements registered.
                                </td>
                            </tr>
                        )}
                        {rows.map(({ item, p }) => (
                            <tr key={`${item.id}-${p.place_id}`}>
                                <td>{formatLocation(p)}</td>
                                <td>{item.code}</td>
                                <td>{item.name}</td>
                                <td>{p.quantity}</td>
                                <td>
                                    <span
                                        className={`badge ${item.item_condition}`}>
                                        {item.item_condition}
                                    </span>
                                </td>
                                <td>
                                    <div className="actions">
                                        <button
                                            type="button"
                                            onClick={() => edit(item, p)}>
                                            Edit / move
                                        </button>
                                        <button
                                            type="button"
                                            className="danger"
                                            onClick={() => remove(item, p)}>
                                            Remove
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
