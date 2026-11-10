import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "node:path";

const db = new Database(path.join(process.cwd(), "data.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
        email         TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role          TEXT NOT NULL CHECK (role IN ('admin','worker','shelf-worker')),
        created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS storage_items (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        name           TEXT NOT NULL,
        count          INTEGER NOT NULL CHECK (count >= 0),
        code           TEXT NOT NULL UNIQUE CHECK (length(code) = 10),
        item_condition TEXT NOT NULL CHECK (item_condition IN ('new','good','damaged','expired')),
        description    TEXT
    );

    CREATE TABLE IF NOT EXISTS place (
        place_id            INTEGER PRIMARY KEY AUTOINCREMENT,
        storage_row_number  INTEGER NOT NULL,
        shelf_column_number INTEGER NOT NULL,
        shelf_number        INTEGER NOT NULL,
        UNIQUE (storage_row_number, shelf_column_number, shelf_number)
    );

    CREATE TABLE IF NOT EXISTS items_place (
        item_id  INTEGER NOT NULL REFERENCES storage_items(id) ON DELETE CASCADE,
        place_id INTEGER NOT NULL REFERENCES place(place_id)   ON DELETE CASCADE,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        PRIMARY KEY (item_id, place_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
        order_id      INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
        customer_name TEXT NOT NULL,
        order_status  TEXT NOT NULL DEFAULT 'new'
                      CHECK (order_status IN ('new','processing','shipped','completed','cancelled')),
        created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders_items (
        order_id      INTEGER NOT NULL REFERENCES orders(order_id)  ON DELETE CASCADE,
        item_id       INTEGER NOT NULL REFERENCES storage_items(id) ON DELETE CASCADE,
        count_ordered INTEGER NOT NULL CHECK (count_ordered > 0),
        PRIMARY KEY (order_id, item_id)
    );

    CREATE TABLE IF NOT EXISTS change_history (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
        description TEXT NOT NULL,
        created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
`);

// The first admin is created from environment variables (see .env.example).
// All other accounts are created by an admin in the Users page.
const adminExists = db
    .prepare("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1")
    .get();
if (!adminExists && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    db.prepare(
        "INSERT OR IGNORE INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'admin')",
    ).run(
        process.env.ADMIN_USERNAME || "admin",
        process.env.ADMIN_EMAIL.trim().toLowerCase(),
        bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12),
    );
}

export default db;
