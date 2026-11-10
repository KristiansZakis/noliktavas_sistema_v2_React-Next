"use client";

import { useState } from "react";
import { useApi } from "@/components/api-client";
import { formatLocation } from "@/lib/constants";

function CoordFields({ place }) {
    return (
        <>
            <label>
                Row
                <input
                    name="row"
                    type="number"
                    min={1}
                    max={999}
                    defaultValue={place?.storage_row_number}
                    required
                />
            </label>
            <label>
                Column
                <input
                    name="column"
                    type="number"
                    min={1}
                    max={999}
                    defaultValue={place?.shelf_column_number}
                    required
                />
            </label>
            <label>
                Shelf
                <input
                    name="shelf"
                    type="number"
                    min={1}
                    max={99}
                    defaultValue={place?.shelf_number}
                    required
                />
            </label>
        </>
    );
}

export default function PlacesManager({ places }) {
    const { error, setError, call } = useApi();
    const [editing, setEditing] = useState(null);

    async function save(e, id) {
        e.preventDefault();
        const form = e.target;
        const r = await call(
            id ? `/api/places/${id}` : "/api/places",
            id ? "PATCH" : "POST",
            Object.fromEntries(new FormData(form)),
        );
        if (!r.ok) return;
        setEditing(null);
        form.reset();
    }

    async function remove(p) {
        if (
            confirm(
                `Delete ${formatLocation(p)}? Placements stored there (${p.items.length}) are removed.`,
            )
        )
            await call(`/api/places/${p.place_id}`, "DELETE");
    }

    return (
        <>
            <p className="muted">
                R = storage row, C = shelf column, S = shelf level.
            </p>
            <div className="panel">
                <h2>Add location</h2>
                <form className="form" onSubmit={(e) => save(e, null)}>
                    <CoordFields />
                    <button className="primary" type="submit">
                        Add
                    </button>
                </form>
            </div>

            {error && <p className="error">{error}</p>}

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Location</th>
                            <th>Items stored</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {places.length === 0 && (
                            <tr>
                                <td colSpan={3} className="muted">
                                    No locations yet.
                                </td>
                            </tr>
                        )}
                        {places.map((p) =>
                            editing === p.place_id ? (
                                <tr key={p.place_id}>
                                    <td colSpan={3}>
                                        <form
                                            className="form"
                                            onSubmit={(e) =>
                                                save(e, p.place_id)
                                            }>
                                            <CoordFields place={p} />
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
                                <tr key={p.place_id}>
                                    <td>{formatLocation(p)}</td>
                                    <td>
                                        {p.items.length ? (
                                            p.items
                                                .map(
                                                    (i) =>
                                                        `${i.name} ×${i.quantity}`,
                                                )
                                                .join(", ")
                                        ) : (
                                            <span className="muted">empty</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="actions">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditing(p.place_id);
                                                    setError("");
                                                }}>
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="danger"
                                                onClick={() => remove(p)}>
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
