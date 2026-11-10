import { api } from "@/lib/api";
import { updateItem, deleteItem } from "@/lib/services";
import { int } from "@/lib/validate";

export const PATCH = api("items.edit", ({ user, body, params }) =>
    updateItem(user, int(params.id, "Id", { min: 1 }), body),
);

export const DELETE = api("items.delete", ({ user, params }) =>
    deleteItem(user, int(params.id, "Id", { min: 1 })),
);
