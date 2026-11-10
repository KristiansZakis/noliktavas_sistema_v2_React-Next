"use client";

import { useState } from "react";
import { useApi } from "@/components/api-client";

export default function OrderForm({ items }) {
    const { error, call, router } = useApi();
    const [customer, setCustomer] = useState("");
    const [lines, setLines] = useState([{ itemId: "", quantity: 1 }]);

    const setLine = (i, patch) =>
        setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

    async function submit(e) {
        e.preventDefault();
        const r = await call("/api/orders", "POST", { customer_name: customer, lines });
        if (r.ok) router.push(`/orders/${r.data.id}`);
    }

    return (
        <form onSubmit={submit}>
            <div className="form">
                <label>
                    Customer name
                    <input value={customer} onChange={(e) => setCustomer(e.target.value)} maxLength={100} required style={{ minWidth: 260 }} />
                </label>
            </div>

            {lines.map((l, i) => (
                <div className="form" key={i}>
                    <label>
                        Item
                        <select value={l.itemId} onChange={(e) => setLine(i, { itemId: e.target.value })} required>
                            <option value="" disabled>Select item...</option>
                            {items.map((it) => (
                                <option key={it.id} value={it.id}>{it.name} ({it.code}) - {it.count} in stock</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Quantity
                        <input type="number" min={1} max={100000} value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} required />
                    </label>
                    <button type="button" className="danger" disabled={lines.length === 1} onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}>
                        Remove
                    </button>
                </div>
            ))}

            <div className="actions">
                <button type="button" onClick={() => setLines((ls) => [...ls, { itemId: "", quantity: 1 }])}>+ Add line</button>
                <button type="submit" className="primary">Create order</button>
            </div>
            {error && <p className="error">{error}</p>}
        </form>
    );
}
