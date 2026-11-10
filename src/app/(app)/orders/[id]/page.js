import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { getOrder } from "@/lib/services";
import OrderActions from "@/components/OrderActions";

export default async function Page({ params }) {
    await requirePermission("orders.manage");
    const id = Number((await params).id);
    const data = Number.isInteger(id) ? getOrder(id) : null;
    if (!data) notFound();
    const { order, lines } = data;

    return (
        <>
            <p><Link href="/orders">← All orders</Link></p>
            <h1>
                Order #{order.order_id} <span className={`badge ${order.order_status}`}>{order.order_status}</span>
            </h1>
            <p>
                Customer: <strong>{order.customer_name}</strong> · created {order.created_at} UTC by {order.username ?? "(deleted user)"}
            </p>

            <h2>Status</h2>
            <OrderActions orderId={order.order_id} status={order.order_status} />

            <h2>Lines</h2>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Code</th><th>Item</th><th>Ordered</th><th>In stock now</th></tr></thead>
                    <tbody>
                        {lines.map((l) => (
                            <tr key={l.item_id}><td>{l.code}</td><td>{l.name}</td><td>{l.count_ordered}</td><td>{l.stock}</td></tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
