import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { HttpError } from "@/lib/validate";
import * as v from "@/lib/validate";
import { ORDER_FLOW, formatLocation } from "@/lib/constants";

/* ---------- helpers ---------- */

const notFound = (what) => new HttpError(404, `${what} not found`);

const UNIQUE_MESSAGES = {
    "users.username": "Username already taken",
    "users.email": "Email already taken",
    "storage_items.code": "An item with this code already exists",
    "place.storage_row_number": "This location already exists",
};

// Runs fn in a transaction and turns UNIQUE violations into friendly 409s.
function write(fn) {
    try {
        return db.transaction(fn)();
    } catch (err) {
        const m = /UNIQUE constraint failed: ([\w.]+)/.exec(err?.message ?? "");
        if (!m) throw err;
        throw new HttpError(409, UNIQUE_MESSAGES[m[1]] ?? "Duplicate value");
    }
}

// Every data change is recorded here; the warehouse report shows the latest.
function log(user, description) {
    db.prepare(
        "INSERT INTO change_history (user_id, description) VALUES (?, ?)",
    ).run(user.id, description);
}

/* ---------- users (admin) ---------- */

export const listUsers = () =>
    db
        .prepare("SELECT id, username, email, role, created_at FROM users ORDER BY id")
        .all();

const adminCount = () =>
    db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").get().n;

export async function createUser(body) {
    const f = v.userFields(body, { passwordRequired: true });
    const hash = await bcrypt.hash(f.password, 12);
    return write(() => {
        const r = db
            .prepare(
                "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
            )
            .run(f.username, f.email, hash, f.role);
        return { id: Number(r.lastInsertRowid) };
    });
}

export async function updateUser(actor, id, body) {
    const target = db.prepare("SELECT id, role FROM users WHERE id = ?").get(id);
    if (!target) throw notFound("User");
    const f = v.userFields(body, { passwordRequired: false });

    if (target.id === actor.id && f.role !== target.role)
        throw new HttpError(400, "You cannot change your own role");
    if (target.role === "admin" && f.role !== "admin" && adminCount() <= 1)
        throw new HttpError(400, "There must be at least one admin");

    const hash = f.password ? await bcrypt.hash(f.password, 12) : null;
    write(() =>
        db
            .prepare(
                "UPDATE users SET username=?, email=?, role=?, password_hash=COALESCE(?, password_hash) WHERE id=?",
            )
            .run(f.username, f.email, f.role, hash, id),
    );
    return { ok: true };
}

export function deleteUser(actor, id) {
    if (id === actor.id)
        throw new HttpError(400, "You cannot delete your own account");
    const target = db.prepare("SELECT role FROM users WHERE id = ?").get(id);
    if (!target) throw notFound("User");
    if (target.role === "admin" && adminCount() <= 1)
        throw new HttpError(400, "There must be at least one admin");
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
    return { ok: true };
}

/* ---------- items ---------- */

// Items together with the shelf locations they are placed on.
export function listItems() {
    const items = db
        .prepare("SELECT * FROM storage_items ORDER BY name COLLATE NOCASE, id")
        .all();
    const placements = db
        .prepare(
            `SELECT ip.item_id, ip.place_id, ip.quantity,
                    p.storage_row_number, p.shelf_column_number, p.shelf_number
             FROM items_place ip JOIN place p ON p.place_id = ip.place_id
             ORDER BY p.storage_row_number, p.shelf_column_number, p.shelf_number`,
        )
        .all();
    return items.map((i) => {
        const ps = placements.filter((p) => p.item_id === i.id);
        return { ...i, placements: ps, placed: ps.reduce((s, p) => s + p.quantity, 0) };
    });
}

function getItem(id) {
    const item = db.prepare("SELECT * FROM storage_items WHERE id = ?").get(id);
    if (!item) throw notFound("Item");
    return item;
}

export function createItem(user, body) {
    const f = v.itemFields(body);
    return write(() => {
        const r = db
            .prepare(
                "INSERT INTO storage_items (name, count, code, item_condition, description) VALUES (?, ?, ?, ?, ?)",
            )
            .run(f.name, f.count, f.code, f.item_condition, f.description);
        log(user, `Item "${f.name}" (${f.code}) added, count ${f.count}`);
        return { id: Number(r.lastInsertRowid) };
    });
}

export function updateItem(user, id, body) {
    const old = getItem(id);
    const f = v.itemFields(body);
    write(() => {
        db.prepare(
            "UPDATE storage_items SET name=?, count=?, code=?, item_condition=?, description=? WHERE id=?",
        ).run(f.name, f.count, f.code, f.item_condition, f.description, id);
        log(
            user,
            `Item "${old.name}" (${old.code}) updated: count ${old.count} -> ${f.count}, condition ${old.item_condition} -> ${f.item_condition}`,
        );
    });
    return { ok: true };
}

export function deleteItem(user, id) {
    const item = getItem(id);
    const inOpenOrder = db
        .prepare(
            `SELECT 1 FROM orders_items oi JOIN orders o ON o.order_id = oi.order_id
             WHERE oi.item_id = ? AND o.order_status IN ('new','processing','shipped') LIMIT 1`,
        )
        .get(id);
    if (inOpenOrder) throw new HttpError(409, "Item is used in an open order");
    write(() => {
        db.prepare("DELETE FROM storage_items WHERE id = ?").run(id);
        log(user, `Item "${item.name}" (${item.code}) deleted`);
    });
    return { ok: true };
}

/* ---------- shelf locations ---------- */

export function listPlaces() {
    const places = db
        .prepare(
            "SELECT * FROM place ORDER BY storage_row_number, shelf_column_number, shelf_number",
        )
        .all();
    const stored = db
        .prepare(
            `SELECT ip.place_id, ip.quantity, i.name
             FROM items_place ip JOIN storage_items i ON i.id = ip.item_id
             ORDER BY i.name COLLATE NOCASE`,
        )
        .all();
    return places.map((p) => ({
        ...p,
        items: stored.filter((s) => s.place_id === p.place_id),
    }));
}

const getPlace = (id) => {
    const p = db.prepare("SELECT * FROM place WHERE place_id = ?").get(id);
    if (!p) throw notFound("Location");
    return p;
};

export function createPlace(user, body) {
    const c = v.coordFields(body);
    return write(() => {
        const r = db
            .prepare(
                "INSERT INTO place (storage_row_number, shelf_column_number, shelf_number) VALUES (?, ?, ?)",
            )
            .run(c.storage_row_number, c.shelf_column_number, c.shelf_number);
        log(user, `Location ${formatLocation(c)} created`);
        return { id: Number(r.lastInsertRowid) };
    });
}

export function updatePlace(user, id, body) {
    const old = getPlace(id);
    const c = v.coordFields(body);
    write(() => {
        db.prepare(
            "UPDATE place SET storage_row_number=?, shelf_column_number=?, shelf_number=? WHERE place_id=?",
        ).run(c.storage_row_number, c.shelf_column_number, c.shelf_number, id);
        log(user, `Location ${formatLocation(old)} changed to ${formatLocation(c)}`);
    });
    return { ok: true };
}

export function deletePlace(user, id) {
    const old = getPlace(id);
    write(() => {
        db.prepare("DELETE FROM place WHERE place_id = ?").run(id);
        log(user, `Location ${formatLocation(old)} deleted (its placements were removed)`);
    });
    return { ok: true };
}

/* ---------- placement (which item is on which shelf) ---------- */

/**
 * Sets how many units of an item are on a shelf location (creating the
 * location if it does not exist). When `placeId` is given, the item is moved
 * away from that old location first.
 */
export function savePlacement(user, body) {
    const itemId = v.int(body?.itemId, "Item", { min: 1 });
    const quantity = v.int(body?.quantity, "Quantity", { min: 1 });
    const c = v.coordFields(body);
    const fromPlaceId = body?.placeId ? v.int(body.placeId, "Location", { min: 1 }) : null;
    const item = getItem(itemId);

    return write(() => {
        db.prepare(
            "INSERT OR IGNORE INTO place (storage_row_number, shelf_column_number, shelf_number) VALUES (?, ?, ?)",
        ).run(c.storage_row_number, c.shelf_column_number, c.shelf_number);
        const place = db
            .prepare(
                "SELECT place_id FROM place WHERE storage_row_number=? AND shelf_column_number=? AND shelf_number=?",
            )
            .get(c.storage_row_number, c.shelf_column_number, c.shelf_number);

        const moving = fromPlaceId && fromPlaceId !== place.place_id;
        let finalQty = quantity;
        if (moving) {
            db.prepare("DELETE FROM items_place WHERE item_id=? AND place_id=?").run(itemId, fromPlaceId);
            // Moving onto a shelf that already holds this item merges the units.
            finalQty += db
                .prepare("SELECT quantity FROM items_place WHERE item_id=? AND place_id=?")
                .get(itemId, place.place_id)?.quantity ?? 0;
        }

        const elsewhere = db
            .prepare(
                "SELECT COALESCE(SUM(quantity),0) AS n FROM items_place WHERE item_id=? AND place_id<>?",
            )
            .get(itemId, place.place_id).n;
        if (elsewhere + finalQty > item.count)
            throw new HttpError(
                400,
                `Cannot place ${elsewhere + finalQty} units: "${item.name}" has only ${item.count} in stock`,
            );

        db.prepare(
            `INSERT INTO items_place (item_id, place_id, quantity) VALUES (?, ?, ?)
             ON CONFLICT(item_id, place_id) DO UPDATE SET quantity = excluded.quantity`,
        ).run(itemId, place.place_id, finalQty);
        log(user, `Placement: ${finalQty} x "${item.name}" at ${formatLocation(c)}${moving ? " (moved)" : ""}`);
        return { ok: true };
    });
}

export function removePlacement(user, body) {
    const itemId = v.int(body?.itemId, "Item", { min: 1 });
    const placeId = v.int(body?.placeId, "Location", { min: 1 });
    const item = getItem(itemId);
    const place = getPlace(placeId);
    write(() => {
        const r = db
            .prepare("DELETE FROM items_place WHERE item_id=? AND place_id=?")
            .run(itemId, placeId);
        if (!r.changes) throw notFound("Placement");
        log(user, `Placement removed: "${item.name}" from ${formatLocation(place)}`);
    });
    return { ok: true };
}

/* ---------- orders ---------- */

export const listOrders = () =>
    db
        .prepare(
            `SELECT o.order_id, o.customer_name, o.order_status, o.created_at, u.username,
                    COALESCE((SELECT SUM(count_ordered) FROM orders_items WHERE order_id = o.order_id), 0) AS units
             FROM orders o LEFT JOIN users u ON u.id = o.user_id
             ORDER BY o.order_id DESC`,
        )
        .all();

export function getOrder(id) {
    const order = db
        .prepare(
            `SELECT o.*, u.username FROM orders o
             LEFT JOIN users u ON u.id = o.user_id WHERE o.order_id = ?`,
        )
        .get(id);
    if (!order) return null;
    const lines = db
        .prepare(
            `SELECT oi.item_id, oi.count_ordered, i.name, i.code, i.count AS stock
             FROM orders_items oi JOIN storage_items i ON i.id = oi.item_id
             WHERE oi.order_id = ? ORDER BY i.name COLLATE NOCASE`,
        )
        .all(id);
    return { order, lines };
}

export function createOrder(user, body) {
    const f = v.orderFields(body);
    return write(() => {
        for (const l of f.lines) {
            const item = db
                .prepare("SELECT name, count FROM storage_items WHERE id = ?")
                .get(l.itemId);
            if (!item) throw new HttpError(400, `Item #${l.itemId} does not exist`);
            if (l.quantity > item.count)
                throw new HttpError(
                    400,
                    `Only ${item.count} of "${item.name}" in stock (requested ${l.quantity})`,
                );
        }
        const r = db
            .prepare("INSERT INTO orders (user_id, customer_name) VALUES (?, ?)")
            .run(user.id, f.customer_name);
        const id = Number(r.lastInsertRowid);
        const insert = db.prepare(
            "INSERT INTO orders_items (order_id, item_id, count_ordered) VALUES (?, ?, ?)",
        );
        for (const l of f.lines) insert.run(id, l.itemId, l.quantity);
        log(user, `Order #${id} created for "${f.customer_name}"`);
        return { id };
    });
}

// Moves an order along ORDER_FLOW. Shipping takes the units out of stock.
export function setOrderStatus(user, id, body) {
    const status = v.orderStatus(body?.status);
    return write(() => {
        const order = db.prepare("SELECT * FROM orders WHERE order_id = ?").get(id);
        if (!order) throw notFound("Order");
        if (!ORDER_FLOW[order.order_status].includes(status))
            throw new HttpError(
                409,
                `Cannot change status from '${order.order_status}' to '${status}'`,
            );

        if (status === "shipped") {
            const lines = db
                .prepare(
                    `SELECT oi.item_id, oi.count_ordered, i.name, i.count
                     FROM orders_items oi JOIN storage_items i ON i.id = oi.item_id
                     WHERE oi.order_id = ?`,
                )
                .all(id);
            for (const l of lines) {
                if (l.count < l.count_ordered)
                    throw new HttpError(
                        409,
                        `Not enough stock of "${l.name}": ${l.count} available, ${l.count_ordered} needed`,
                    );
            }
            const take = db.prepare("UPDATE storage_items SET count = count - ? WHERE id = ?");
            for (const l of lines) take.run(l.count_ordered, l.item_id);
        }

        db.prepare("UPDATE orders SET order_status = ? WHERE order_id = ?").run(status, id);
        log(user, `Order #${id}: ${order.order_status} -> ${status}`);
        return { ok: true };
    });
}

export function deleteOrder(user, id) {
    const order = db.prepare("SELECT order_status FROM orders WHERE order_id = ?").get(id);
    if (!order) throw notFound("Order");
    if (!["new", "cancelled"].includes(order.order_status))
        throw new HttpError(409, "Only 'new' or 'cancelled' orders can be deleted");
    write(() => {
        db.prepare("DELETE FROM orders WHERE order_id = ?").run(id);
        log(user, `Order #${id} deleted`);
    });
    return { ok: true };
}

/* ---------- reports ---------- */
// A report is generated on demand: { title, summary: [text], sections: [{ title, head, rows }] }

export function buildReport(type, user) {
    const items = listItems();
    const generated = `Generated ${new Date().toISOString().slice(0, 19).replace("T", " ")} UTC by ${user.username}`;

    if (type === "warehouse") {
        const orders = listOrders();
        const byStatus = {};
        for (const o of orders) byStatus[o.order_status] = (byStatus[o.order_status] ?? 0) + 1;
        const changes = db
            .prepare(
                `SELECT h.created_at, u.username, h.description
                 FROM change_history h LEFT JOIN users u ON u.id = h.user_id
                 ORDER BY h.id DESC LIMIT 30`,
            )
            .all();
        return {
            title: "Warehouse activity report",
            summary: [
                generated,
                `Item types: ${items.length}, total units: ${items.reduce((s, i) => s + i.count, 0)}`,
                `Orders: ${orders.length} (${Object.entries(byStatus).map(([k, n]) => `${k} ${n}`).join(", ") || "none"})`,
            ],
            sections: [
                {
                    title: "Stock",
                    head: ["Code", "Name", "Count", "Condition"],
                    rows: items.map((i) => [i.code, i.name, i.count, i.item_condition]),
                },
                {
                    title: "Orders",
                    head: ["Order", "Created", "Customer", "Status", "Units"],
                    rows: orders.map((o) => [`#${o.order_id}`, o.created_at, o.customer_name, o.order_status, o.units]),
                },
                {
                    title: "Latest changes",
                    head: ["Time", "User", "Change"],
                    rows: changes.map((c) => [c.created_at, c.username ?? "(deleted)", c.description]),
                },
            ],
        };
    }

    // placement
    return {
        title: "Placement and condition report",
        summary: [generated],
        sections: [
            {
                title: "Items on shelves",
                head: ["Location", "Code", "Name", "Quantity", "Condition"],
                rows: items.flatMap((i) =>
                    i.placements.map((p) => [formatLocation(p), i.code, i.name, p.quantity, i.item_condition]),
                ),
            },
            {
                title: "Not fully placed",
                head: ["Code", "Name", "Units without a location"],
                rows: items
                    .filter((i) => i.count > i.placed)
                    .map((i) => [i.code, i.name, `${i.count - i.placed} of ${i.count}`]),
            },
            {
                title: "Damaged or expired",
                head: ["Code", "Name", "Condition", "Locations"],
                rows: items
                    .filter((i) => ["damaged", "expired"].includes(i.item_condition))
                    .map((i) => [
                        i.code,
                        i.name,
                        i.item_condition,
                        i.placements.map(formatLocation).join(", ") || "not placed",
                    ]),
            },
        ],
    };
}
