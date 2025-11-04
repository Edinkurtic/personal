import { Database, open } from "sqlite";
import sqlite3 from "sqlite3";
import { access, readFile, unlink } from "fs/promises";

const DB_FILE = "./src/app.db";
let _db: Database | null = null;

async function ensureValidDbFile(): Promise<void> {
    try {
        await access(DB_FILE);
        const buf = await readFile(DB_FILE);
        const header = buf.subarray(0, 16).toString("utf8");
        if (header !== "SQLite format 3\u0000") {
            console.warn("Invalid SQLite file detected, deleting...");
            await unlink(DB_FILE);
        }
    } catch (err) {

        console.log("Database file does not exist yet, will be created");
    }
}

async function getDb(): Promise<Database> {
    if (!_db) {
        await ensureValidDbFile();
        _db = await open({
            filename: DB_FILE,
            driver: sqlite3.Database
        });
        await _db.run('PRAGMA foreign_keys = ON');
        console.log("Database connection established");
    }
    return _db;
}

export class DB {
    public static async getConnection(): Promise<Database> {
        const db = await getDb();

        if (!_db) {
            await DB.createAllTables();
        }

        return db;
    }

    public static async createUsersTable(): Promise<void> {
        const db = await getDb();
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                                                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                 username TEXT NOT NULL UNIQUE,
                                                 display_name TEXT,
                                                 created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        `);
    }

    public static async createMessagesTable(): Promise<void> {
        const db = await getDb();
        await db.exec(`
            CREATE TABLE IF NOT EXISTS messages (
                                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                    user_id INTEGER NOT NULL,
                                                    content TEXT NOT NULL,
                                                    created_at TEXT NOT NULL DEFAULT (datetime('now')),
                                                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
            CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
        `);
    }

    public static async createAllTables(): Promise<void> {
        const db = await getDb();
        await db.exec("BEGIN TRANSACTION;");
        try {
            await DB.createUsersTable();
            await DB.createMessagesTable();
            await db.exec("COMMIT;");
            console.log("All database tables created successfully");
        } catch (err) {
            await db.exec("ROLLBACK;");
            console.error("Failed to create tables:", err);
            throw err;
        }
    }
    public static async closeDb(): Promise<void> {
        if (_db) {
            await _db.close();
            _db = null;
            console.log("Database connection closed");
        }
    }
}