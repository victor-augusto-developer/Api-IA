import { Router } from "express";
import { GetDailyTokensCache, ResetDatabase} from "../service/usage.service.js";

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
            message: "Failed to retrieve usage statistics."
        });

    }
});

dashboardRoute.delete("/database", async (req, res) => {
    try {

        await ResetDatabase();

        res.status(200).json({
            success: true,
            message: "Database reset successfully."
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Failed to reset database."
        });

    }
});
export default dashboardRoute;