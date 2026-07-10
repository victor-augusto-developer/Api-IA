import {db} from "../database/index.js";

let DailyTokens = null;


export async function saveUsage(data) {

    const database = await db;

    await database.run(
        `
        INSERT INTO ai_usage (
            model,
            prompt_tokens,
            completion_tokens,
            total_tokens,
            response_time
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            data.model,
            data.prompt_tokens,
            data.completion_tokens,
            data.total_tokens,
            data.response_time
        ]
    );
    ClearCache();

}

export async function getDailyTokens() {

    const database = await db;

    return await database.all(`
        SELECT
            DATE(created_at) as day,
            SUM(total_tokens) as tokens
        FROM ai_usage
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
    `);

}

export async function ResetDatabase() {

    const database = await db;

    await database.run(`
        DELETE FROM ai_usage;
    `);

    ClearCache();

}

export async function GetDailyTokensCache() {

    if (DailyTokens !== null) {
        return DailyTokens;
    }

    DailyTokens = await getDailyTokens();

    return DailyTokens;

}

export function ClearCache() {

    DailyTokens = null;

}