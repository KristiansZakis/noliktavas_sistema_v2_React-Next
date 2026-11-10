import { api } from "@/lib/api";
import { createOrder } from "@/lib/services";

export const POST = api("orders.manage", ({ user, body }) => {
    const { id } = createOrder(user, body);
    return Response.json({ ok: true, id }, { status: 201 });
});
