import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const db = new Database(path.join(process.cwd(), "data.db"));
db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'worker', 'client')),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
