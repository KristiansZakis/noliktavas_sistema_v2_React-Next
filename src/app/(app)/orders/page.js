import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { listOrders } from "@/lib/services";

export default async function Page() {
    await requirePermission("orders.manage");
    const orders = listOrders();
    return (
        <>
            <h1>Orders</h1>
            <p><Link href="/orders/new">+ New order</Link></p>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Units</th><th>Created (UTC)</th><th>By</th></tr></thead>
                    <tbody>
                        {orders.length === 0 && <tr><td colSpan={6} className="muted">No orders yet.</td></tr>}
                        {orders.map((o) => (
                            <tr key={o.order_id}>
                                <td><Link href={`/orders/${o.order_id}`}>#{o.order_id}</Link></td>
                                <td>{o.customer_name}</td>
                                <td><span className={`badge ${o.order_status}`}>{o.order_status}</span></td>
                                <td>{o.units}</td>
                                <td>{o.created_at}</td>
                                <td>{o.username ?? <span className="muted">(deleted)</span>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
