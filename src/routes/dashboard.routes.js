import { Router } from "express";
import { GetDailyTokensCache } from "../service/usage.service.js";

const dashboardRoute = Router();


dashboardRoute.get("/", async (req, res) => {

    const usage = await GetDailyTokensCache();

    res.render("dashboard", {
        usage
    });

});


dashboardRoute.get("/usage", async (req, res) => {
    try {

        const usage = await GetDailyTokensCache();

        res.json({
            success: true,
            usage
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Erro ao obter estatísticas."
        });

    }
});
export default dashboardRoute;