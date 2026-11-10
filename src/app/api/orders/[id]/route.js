import { api } from "@/lib/api";
import { setOrderStatus, deleteOrder } from "@/lib/services";
import { int } from "@/lib/validate";

export const PATCH = api("orders.manage", ({ user, body, params }) =>
    setOrderStatus(user, int(params.id, "Id", { min: 1 }), body),
);

export const DELETE = api("orders.manage", ({ user, params }) =>
    deleteOrder(user, int(params.id, "Id", { min: 1 })),
);
