import { api } from "@/lib/api";
import { createUser } from "@/lib/services";

export const POST = api("users.manage", async ({ body }) => {
    const { id } = await createUser(body);
    return Response.json({ ok: true, id }, { status: 201 });
});
