import db from "./database.js";

export async function initDatabase(){

    await db.exec(`
        CREATE TABLE IF NOT EXISTS ai_usage (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

            model TEXT,

            prompt_tokens INTEGER DEFAULT 0,

            completion_tokens INTEGER DEFAULT 0,

            total_tokens INTEGER DEFAULT 0,

            response_time INTEGER DEFAULT 0

        );
    `);

}