import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";

const databasePath = "./database/usage.db";

const SQL = await initSqlJs();

let sqlite;


if (fs.existsSync(databasePath)) {

    const buffer = fs.readFileSync(databasePath);

    sqlite = new SQL.Database(buffer);

} else {

    sqlite = new SQL.Database();

}


const database = {

    exec(sql) {

        const result = sqlite.run(sql);

        save();

        return result;
    },


    run(sql, params = []) {

        const stmt = sqlite.prepare(sql);

        stmt.bind(params);

        stmt.step();

        stmt.free();

        save();

        return true;
    },


    all(sql, params = []) {

        const stmt = sqlite.prepare(sql);

        stmt.bind(params);

        const result = [];

        while (stmt.step()) {

            result.push(
                stmt.getAsObject()
            );

        }

        stmt.free();

        return result;
    }

};


function save() {

    const data = sqlite.export();

    fs.writeFileSync(
        databasePath,
        Buffer.from(data)
    );

}


export default database;