let database;
let initDatabase;

if (process.env.RUNTIME === "termux") {

    console.log("Running with SQL.js");

    database = await import("./termux/database.js");
    initDatabase = await import("./termux/init.js");

} else {

    console.log("Running with SQLite");

    database = await import("./desktop/database.js");
    initDatabase = await import("./desktop/init.js");

}

export const db = database.default;
export const init = initDatabase.initDatabase;