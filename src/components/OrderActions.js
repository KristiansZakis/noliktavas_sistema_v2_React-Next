"use client";

import { useApi } from "@/components/api-client";
import { ORDER_FLOW } from "@/lib/constants";

export default function OrderActions({ orderId, status }) {
    const { error, call, router } = useApi();
    const next = ORDER_FLOW[status];
    const deletable = ["new", "cancelled"].includes(status);

    async function change(s) {
        if (s === "cancelled" && !confirm("Cancel this order?")) return;
        await call(`/api/orders/${orderId}`, "PATCH", { status: s });
    }

    async function remove() {
        if (!confirm("Delete this order permanently?")) return;
        const r = await call(`/api/orders/${orderId}`, "DELETE");
        if (r.ok) router.push("/orders");
    }

    return (
        <>
            <div className="actions">
                {next.map((s) => (
                    <button
                        type="button"
                        key={s}
                        className={s === "cancelled" ? "danger" : "primary"}
                        onClick={() => change(s)}>
                        {s === "cancelled" ? "Cancel order" : `Mark as ${s}`}
                    </button>
                ))}
                {deletable && (
                    <button type="button" className="danger" onClick={remove}>
                        Delete order
                    </button>
                )}
                {!next.length && !deletable && (
                    <span className="muted">No further actions.</span>
                )}
            </div>
            {error && <p className="error">{error}</p>}
        </>
    );
}
