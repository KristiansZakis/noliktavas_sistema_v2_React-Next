import { ROLES, ITEM_CONDITIONS, ORDER_STATUSES } from "@/lib/constants";

export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const bad = (message) => {
    throw new HttpError(400, message);
};

export function str(value, label, { min = 1, max = 100 } = {}) {
    if (typeof value !== "string") bad(`${label} is required`);
    const s = value.trim();
    const hasControlChar = [...s].some((ch) => {
        const code = ch.charCodeAt(0);
        return (
            code <= 8 ||
            code === 11 ||
            code === 12 ||
            (code >= 14 && code <= 31)
        );
    });
    if (hasControlChar) bad(`${label} contains invalid characters`);
    if (s.length < min || s.length > max)
        bad(`${label} must be ${min}-${max} characters`);
    return s;
}

export function int(value, label, { min = 0, max = 1_000_000 } = {}) {
    const n =
        typeof value === "string" && value.trim() !== ""
            ? Number(value)
            : value;
    if (!Number.isInteger(n) || n < min || n > max)
        bad(`${label} must be a whole number between ${min} and ${max}`);
    return n;
}

export function oneOf(value, label, list) {
    if (!list.includes(value)) bad(`${label} is invalid`);
    return value;
}

export function itemFields(body) {
    const b = body ?? {};
    const code = str(b.code, "Code", { min: 10, max: 10 }).toUpperCase();
    if (!/^[A-Z0-9]{10}$/.test(code))
        bad("Code must be exactly 10 letters or digits");
    const hasDescription = b.description != null && b.description !== "";
    return {
        name: str(b.name, "Name"),
        count: int(b.count, "Count"),
        code,
        item_condition: oneOf(b.item_condition, "Condition", ITEM_CONDITIONS),
        description: hasDescription
            ? str(b.description, "Description", { max: 500 })
            : null,
    };
}

export function coordFields(body) {
    const b = body ?? {};
    return {
        storage_row_number: int(b.row, "Row", { min: 1, max: 999 }),
        shelf_column_number: int(b.column, "Column", { min: 1, max: 999 }),
        shelf_number: int(b.shelf, "Shelf", { min: 1, max: 99 }),
    };
}

export function userFields(body, { passwordRequired }) {
    const b = body ?? {};
    const username = str(b.username, "Username", { max: 20 });
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
        bad("Username must be 3-20 characters: letters, numbers, underscore");
    const email = str(b.email, "Email", { max: 120 }).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) bad("Invalid email");
    const role = oneOf(b.role, "Role", ROLES);

    let password = null;
    if (
        (typeof b.password === "string" && b.password !== "") ||
        passwordRequired
    ) {
        if (typeof b.password !== "string" || b.password.length < 8)
            bad("Password must be at least 8 characters");
        if (Buffer.byteLength(b.password) > 72)
            bad("Password must be at most 72 bytes");
        password = b.password;
    }
    return { username, email, role, password };
}

export function orderFields(body) {
    const b = body ?? {};
    const customer_name = str(b.customer_name, "Customer name");
    if (!Array.isArray(b.lines) || b.lines.length < 1 || b.lines.length > 50)
        bad("An order needs between 1 and 50 lines");
    const seen = new Set();
    const lines = b.lines.map((l, i) => {
        const itemId = int(l?.itemId, `Line ${i + 1} item`, { min: 1 });
        const quantity = int(l?.quantity, `Line ${i + 1} quantity`, { min: 1 });
        if (seen.has(itemId)) bad("The same item appears twice in the order");
        seen.add(itemId);
        return { itemId, quantity };
    });
    return { customer_name, lines };
}

export const orderStatus = (v) => oneOf(v, "Status", ORDER_STATUSES);
