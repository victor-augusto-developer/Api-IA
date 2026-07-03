import "dotenv/config"
import express from "express";

const app = express();
app.use(express.json());

import route from "./route.routes.js";
app.use(route);

app.listen(process.env.PORT, () => {
  console.log("API rodando em http://localhost:"+process.env.PORT);
});