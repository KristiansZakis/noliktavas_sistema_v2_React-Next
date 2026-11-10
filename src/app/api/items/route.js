import { api } from "@/lib/api";
import { createItem } from "@/lib/services";

export const POST = api("items.edit", async ({ user, body }) => {
    const { id } = await createItem(user, body);
    return Response.json({ ok: true, id }, { status: 201 });
});
