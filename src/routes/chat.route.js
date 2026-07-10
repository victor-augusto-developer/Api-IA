import express from "express";

import askAI from "../service/ia.service.js";
import { saveUsage, GetDailyTokensCache } from "../service/usage.service.js";
import fs from "fs";
const chatRoute = express.Router();


const SYSTEM_PROMPT = fs.readFileSync(
    "./src/prompt/ChatDashboard.txt",
    "utf-8"
);

const SYSTEM_INFO = fs.readFileSync(
    "./src/prompt/SystemInfo.txt",
    "utf-8"
);

chatRoute.post("/chat", async (req, res) => {

    const start = Date.now();


    try {


        const { message, history = [] } = req.body;


        const tokensData = await GetDailyTokensCache();


        const tokensUsed = tokensData
            .map(item => `${item.day}: ${item.tokens} tokens`)
            .join("\n");

        const systemInfo = SYSTEM_INFO
            .replace(
                "{PORT}",
                process.env.PORT || "não definida"
            )
            .replace(
                "{RUNTIME}",
                process.env.RUNTIME || "não definido"
            );
       


        const messages = [

            {
        role: "system",
        content: 
            SYSTEM_PROMPT
            .replace("{TOKENS}", tokensUsed)
            + "\n\n"
            + systemInfo
    },


            ...history,


            {
                role: "user",
                content: message
            }

        ];



        const response = await askAI(messages, false);



        const content = response.choices[0].message.content;



        const usage = response.usage;



        const responseTime = Date.now() - start;



        if (usage) {


            await saveUsage({

                model: response.model,

                prompt_tokens: usage.prompt_tokens || 0,

                completion_tokens: usage.completion_tokens || 0,

                total_tokens: usage.total_tokens || 0,

                response_time: responseTime

            });


        }



        res.json({

            response: content,

            usage

        });



    } catch(err) {


        console.error(err);


        res.status(500).json({

            error: "Erro interno."

        });


    }


});


export default chatRoute;