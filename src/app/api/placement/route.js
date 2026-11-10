import { api } from "@/lib/api";
import { savePlacement, removePlacement } from "@/lib/services";

export const POST = api("placement.manage", ({ user, body }) =>
    savePlacement(user, body),
);

export const DELETE = api("placement.manage", ({ user, body }) =>
    removePlacement(user, body),
);
