import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const db = new Database(path.join(process.cwd(), "data.db"));
db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        username        TEXT NOT NULL UNIQUE COLLATE NOCASE,
        email           TEXT NOT NULL UNIQUE,
        password_hash   TEXT NOT NULL,
        role            TEXT NOT NULL DEFAULT 'shelf-worker' CHECK (role IN ('admin', 'worker', 'shelf-worker')),
        created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )

    CREATE TABLE IF NOT EXISTS storage_items (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        name            TEXT NOT NULL,
        count           INTEGER NOT NULL,
        code            CHAR(10) NOT NULL,
        item_condition  TEXT NOT NULL,
        description     TEXT
    )

    CREATE TABLE IF NOT EXISTS place (
        place_id                INTEGER PRIMARY KEY AUTOINCREMENT,
        storage_row_number      INTEGER NOT NULL,
        shelf_column_number     INTEGER NOT NULL,
        shelf_number            INTEGER NOT NULL
    )

    CREATE TABLE IF NOT EXISTS items_place (
        item_id   INTEGER NOT NULL,
        place_id  INTEGER NOT NULL,
        PRIMARY KEY (item_id, place_id),
        FOREIGN KEY (item_id) REFERENCES storage_items(id) ON DELETE CASCADE,
        FOREIGN KEY (place_id) REFERENCES place(place_id) ON DELETE CASCADE
    )

    CREATE TABLE IF NOT EXISTS change_history (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id         INTEGER,
        user_id         INTEGER,
        action_type     TEXT NOT NULL CHECK(action_type IN ('INSERT', 'UPDATE', 'DELETE')), 
        description     TEXT NOT NULL,
        created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(item_id) REFERENCES storage_items(id) ON DELETE SET NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    )

    CREATE TABLE IF NOT EXISTS reports (
        report_id       INTEGER PRIMARY KEY AUTOINCREMENT,
        report_text     TEXT NOT NULL,
        user_id         INTEGER,
        created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    )

    CREATE TABLE IF NOT EXISTS orders (
        order_id        INTEGER PRIMARY KEY AUTOINCREMENT,
        order_status    TEXT NOT NULL DEFAULT 'Undefined',
        created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )

    CREATE TABLE IF NOT EXISTS report_item (
        report_id INTEGER,
        item_id INTEGER,
        PRIMARY KEY (report_id, item_id),
        FOREIGN KEY(report_id) REFERENCES reports(report_id) ON DELETE CASCADE,
        FOREIGN KEY(item_id) REFERENCES storage_items(id) ON DELETE CASCADE
    )

    CREATE TABLE IF NOT EXISTS orders_items (
        order_id INTEGER,
        item_id INTEGER,
        count_ordered   INTEGER NOT NULL DEFAULT 1,
        PRIMARY KEY (order_id, item_id),
        FOREIGN KEY(order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
        FOREIGN KEY(item_id) REFERENCES storage_items(id) ON DELETE CASCADE
    )

`);

const adminExists = db
    .prepare("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1")
    .get();
if (!adminExists && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const existing = db
        .prepare("SELECT id FROM users WHERE email = ?")
        .get(email);

    if (existing) {
        db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(
            existing.id,
        );
    } else {
        db.prepare(
            "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'admin')",
        ).run(
            process.env.ADMIN_USERNAME || "admin",
            email,
            bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12),
        );
    }
}

export default db;
