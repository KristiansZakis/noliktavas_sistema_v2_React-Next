import { requirePermission } from "@/lib/auth";
import { listItems } from "@/lib/services";
import OrderForm from "@/components/OrderForm";

export default async function Page() {
    await requirePermission("orders.manage");
    const items = listItems().map(({ id, name, code, count }) => ({ id, name, code, count }));
    return (
        <>
            <h1>New order</h1>
            <OrderForm items={items} />
        </>
    );
}
