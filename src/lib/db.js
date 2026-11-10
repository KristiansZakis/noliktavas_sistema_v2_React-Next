import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const db = new Database(path.join(process.cwd(), "data.db"));
db.pragma("journal_mode = WAL");

db.pragma("foreign_keys = ON");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
        email         TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role          TEXT NOT NULL DEFAULT 'shelf-worker'
                      CHECK (role IN ('admin','worker','shelf-worker')),
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
        item_id  INTEGER NOT NULL,
        place_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
        PRIMARY KEY (item_id, place_id),
        FOREIGN KEY (item_id)  REFERENCES storage_items(id) ON DELETE CASCADE,
        FOREIGN KEY (place_id) REFERENCES place(place_id)   ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
        order_id     INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id      INTEGER,
        order_status TEXT NOT NULL DEFAULT 'new'
                     CHECK (order_status IN ('new','processing','packed','shipped','completed','cancelled')),
        created_at   TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
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
