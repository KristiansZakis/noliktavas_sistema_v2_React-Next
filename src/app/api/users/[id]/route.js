import { api } from "@/lib/api";
import { updateUser, deleteUser } from "@/lib/services";
import { int } from "@/lib/validate";

export const PATCH = api("users.manage", ({ user, body, params }) =>
    updateUser(user, int(params.id, "Id", { min: 1 }), body),
);

export const DELETE = api("users.manage", ({ user, params }) =>
    deleteUser(user, int(params.id, "Id", { min: 1 })),
);
