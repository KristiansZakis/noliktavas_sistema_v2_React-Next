import { api } from "@/lib/api";
import { createPlace } from "@/lib/services";

export const POST = api("places.manage", async ({ user, body }) => {
    const { id } = await createPlace(user, body);
    return Response.json({ ok: true, id }, { status: 201 });
});
