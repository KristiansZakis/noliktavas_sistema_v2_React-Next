// Pure constants and helpers - safe to import from server and client code.

export const ROLES = ["admin", "worker", "shelf-worker"];

export const ROLE_LABELS = {
    admin: "Administrator",
    worker: "Warehouse worker",
    "shelf-worker": "Shelf stocker",
};

/* ---------- permissions (the single source of truth for access control) ---------- */

export const PERMISSIONS = {
    "users.manage": "Create, edit, delete users; assign roles",
    "items.view": "View items",
    "items.edit": "Add and edit items",
    "items.delete": "Delete items",
    "places.manage": "Add, edit and delete shelf locations",
    "orders.manage": "Create orders and change their status",
    "placement.manage": "Register and update item placement",
    "reports.warehouse": "Warehouse activity report",
    "reports.placement": "Placement and condition report",
};

const ROLE_PERMISSIONS = {
    admin: [
        "users.manage",
        "items.view",
        "items.edit",
        "items.delete",
        "places.manage",
        "reports.warehouse",
        "reports.placement",
    ],
    worker: [
        "items.view",
        "items.edit",
        "orders.manage",
        "reports.warehouse",
        "reports.placement",
    ],
    "shelf-worker": ["items.view", "placement.manage", "reports.placement"],
};

/** `permission` may be a string or an array (any one of them is enough). */
export function can(role, permission) {
    const granted = ROLE_PERMISSIONS[role] ?? [];
    return [].concat(permission).some((p) => granted.includes(p));
}

/* ---------- navigation ---------- */

// The first menu entry a role may open is that role's home page.
const MENU = [
    { href: "/users", label: "Users", permission: "users.manage" },
    { href: "/orders", label: "Orders", permission: "orders.manage" },
    { href: "/placement", label: "Placement", permission: "placement.manage" },
    { href: "/items", label: "Items", permission: "items.view" },
    { href: "/places", label: "Locations", permission: "places.manage" },
    {
        href: "/reports",
        label: "Reports",
        permission: ["reports.warehouse", "reports.placement"],
    },
];

export const menuFor = (role) => MENU.filter((m) => can(role, m.permission));
export const homeFor = (role) => menuFor(role)[0]?.href ?? "/login";

/* ---------- warehouse data ---------- */

export const ITEM_CONDITIONS = ["new", "good", "damaged", "expired"];

export const ORDER_STATUSES = [
    "new",
    "processing",
    "shipped",
    "completed",
    "cancelled",
];

// Allowed order status transitions (the fulfilment process).
export const ORDER_FLOW = {
    new: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["completed"],
    completed: [],
    cancelled: [],
};

export const REPORTS = {
    warehouse: { label: "Warehouse activity", permission: "reports.warehouse" },
    placement: {
        label: "Placement and condition",
        permission: "reports.placement",
    },
};

export const formatLocation = (p) =>
    `R${p.storage_row_number}-C${p.shelf_column_number}-S${p.shelf_number}`;
