import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs";
import path from "path";

const databaseDir = path.resolve("database");

if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(databaseDir, { recursive: true });
}

const databasePath = path.join(databaseDir, "usage.db");


export default open({
    filename: databasePath,
    driver: sqlite3.Database
});