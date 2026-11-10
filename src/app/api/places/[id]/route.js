import { api } from "@/lib/api";
import { updatePlace, deletePlace } from "@/lib/services";
import { int } from "@/lib/validate";

export const PATCH = api("places.manage", ({ user, body, params }) =>
    updatePlace(user, int(params.id, "Id", { min: 1 }), body),
);

export const DELETE = api("places.manage", ({ user, params }) =>
    deletePlace(user, int(params.id, "Id", { min: 1 })),
);
