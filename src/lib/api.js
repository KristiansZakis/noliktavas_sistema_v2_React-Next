import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/constants";
import { HttpError } from "@/lib/validate";

export function api(permission, handler) {
    return async (request, ctx) => {
        const user = await getCurrentUser();
        if (!user)
            return Response.json({ error: "Not logged in" }, { status: 401 });
        if (!can(user.role, permission))
            return Response.json({ error: "Forbidden" }, { status: 403 });

        try {
            const body =
                request.method === "GET"
                    ? null
                    : await request.json().catch(() => null);
            const params = (await ctx?.params) ?? {};
            const result = await handler({ user, body, params });
            return result instanceof Response
                ? result
                : Response.json(result ?? { ok: true });
        } catch (err) {
            if (err instanceof HttpError)
                return Response.json({ error: err.message }, { status: err.status });
            console.error(err);
            return Response.json({ error: "Server error" }, { status: 500 });
        }
    };
}
