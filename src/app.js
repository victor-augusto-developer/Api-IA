import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { initDatabase } from "./database/init.js";
import dashboardRoute from "./routes/dashboard.routes.js";
import apiroute from "./routes/api.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

await initDatabase();
app.use("/v1", apiroute);
app.use("/", dashboardRoute);


app.listen(process.env.PORT, () => {
    console.log(`API rodando em http://localhost:${process.env.PORT}`);
});